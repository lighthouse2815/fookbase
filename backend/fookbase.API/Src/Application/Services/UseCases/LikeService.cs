using InteractHub.Api.Application.DTOs.Likes;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Services;

public class LikeService : ILikeService
{
    private sealed record ReactionSummary(int Count, IReadOnlyList<ReactionType> TopTypes);

    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;

    public LikeService(
        ILikeRepository likeRepository,
        IPostRepository postRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
    }

    public async Task<PostReactionUsersResponseDto> GetReactionUsersAsync(Guid postId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var reactions = await _likeRepository.GetByPostIdAsync(post.Id, cancellationToken);
        if (reactions.Count == 0)
        {
            return LikeMapper.ToUsersResponseDto(post.Id, Array.Empty<PostReactionUserDto>());
        }

        var userProfiles = await ResolveProfileLookupAsync(reactions.Select(reaction => reaction.UserId), cancellationToken);
        var users = reactions
            .Select(reaction =>
            {
                var profile = userProfiles.TryGetValue(reaction.UserId, out var item)
                    ? item
                    : null;
                return reaction.ToUserDto(profile);
            })
            .ToList();

        return LikeMapper.ToUsersResponseDto(post.Id, users);
    }

    public async Task<PostReactionStateResponseDto> SetReactionAsync(
        Guid postId,
        Guid userId,
        SetPostReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new BusinessException(ErrorCode.INVALID_REACTION_TYPE);
        }

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, userId, cancellationToken);
        var now = DateTime.UtcNow;
        Notification? createdNotification = null;
        string? notificationActorDisplayName = null;
        string? notificationActorAvatarUrl = null;
        if (existingLike is null)
        {
            await _likeRepository.AddAsync(new Like
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                UserId = userId,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (post.UserId != userId)
            {
                var actorProfileLookup = await ResolveProfileLookupAsync([userId], cancellationToken);
                var actorProfile = actorProfileLookup.TryGetValue(userId, out var value) ? value : null;
                notificationActorDisplayName = string.IsNullOrWhiteSpace(actorProfile?.DisplayName)
                    ? "Someone"
                    : actorProfile.DisplayName.Trim();
                notificationActorAvatarUrl = string.IsNullOrWhiteSpace(actorProfile?.AvatarUrl)
                    ? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
                    : actorProfile.AvatarUrl.Trim();

                createdNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = post.UserId,
                    ActorUserId = userId,
                    PostId = post.Id,
                    Type = NotificationType.LIKE,
                    Message = $"{notificationActorDisplayName} reacted to your post.",
                    IsRead = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _notificationRepository.AddAsync(createdNotification, cancellationToken);
            }
        }
        else
        {
            existingLike.Type = normalizedType;
            existingLike.UpdatedAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        if (createdNotification is not null)
        {
            await _notificationRealtimeService.NotifyCreatedAsync(
                createdNotification.ToResponseDto(notificationActorDisplayName, notificationActorAvatarUrl),
                cancellationToken);
        }

        var reactionSummary = await ResolveReactionSummaryAsync(post.Id, cancellationToken);

        return LikeMapper.ToStateResponseDto(post.Id, normalizedType, reactionSummary.Count, reactionSummary.TopTypes);
    }

    public async Task<PostReactionStateResponseDto> RemoveReactionAsync(
        Guid postId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, userId, cancellationToken);
        if (existingLike is not null)
        {
            _likeRepository.Remove(existingLike);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var reactionSummary = await ResolveReactionSummaryAsync(post.Id, cancellationToken);

        return LikeMapper.ToStateResponseDto(post.Id, reactionType: null, reactionSummary.Count, reactionSummary.TopTypes);
    }

    private async Task<ReactionSummary> ResolveReactionSummaryAsync(Guid postId, CancellationToken cancellationToken)
    {
        var reactions = await _likeRepository.GetByPostIdAsync(postId, cancellationToken);
        if (reactions.Count == 0)
        {
            return new ReactionSummary(0, Array.Empty<ReactionType>());
        }

        var topTypes = reactions
            .GroupBy(reaction => reaction.Type)
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key)
            .Take(3)
            .Select(group => group.Key)
            .ToList();

        return new ReactionSummary(reactions.Count, topTypes);
    }

    private async Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveProfileLookupAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);
    }

}


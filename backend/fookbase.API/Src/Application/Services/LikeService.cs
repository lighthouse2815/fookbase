using InteractHub.Api.Application.DTOs.Likes;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class LikeService : ILikeService
{
    private sealed record ReactionSummary(int Count, IReadOnlyList<string> TopTypes);

    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<LikeService> _logger;

    public LikeService(
        ILikeRepository likeRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        IUnitOfWork unitOfWork,
        ILogger<LikeService> logger)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PostReactionUsersResponseDto> GetReactionUsersAsync(Guid postId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var reactions = await _likeRepository.GetByPostIdAsync(post.Id, cancellationToken);
        if (reactions.Count == 0)
        {
            return new PostReactionUsersResponseDto
            {
                PostId = post.Id,
                TotalCount = 0,
                Users = Array.Empty<PostReactionUserDto>()
            };
        }

        var userProfiles = await ResolveProfileLookupAsync(reactions.Select(reaction => reaction.UserId), cancellationToken);
        var users = reactions
            .Select(reaction =>
            {
                var profile = userProfiles.TryGetValue(reaction.UserId, out var item)
                    ? item
                    : null;
                var displayName = Normalize(profile?.DisplayName) ?? "user";
                var avatarUrl = Normalize(profile?.AvatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(reaction.UserId);

                return new PostReactionUserDto
                {
                    UserId = reaction.UserId,
                    DisplayName = displayName,
                    AvatarUrl = avatarUrl,
                    ReactionType = NormalizeReactionType(reaction.Type),
                    ReactedAt = reaction.UpdatedAt ?? reaction.CreatedAt
                };
            })
            .ToList();

        return new PostReactionUsersResponseDto
        {
            PostId = post.Id,
            TotalCount = users.Count,
            Users = users
        };
    }

    public async Task<PostReactionStateResponseDto> SetReactionAsync(
        Guid postId,
        Guid userId,
        SetPostReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        if (!PostReactionTypes.IsValid(request.Type))
        {
            throw new ArgumentException("Reaction type is invalid.");
        }
        var normalizedType = PostReactionTypes.Normalize(request.Type);

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, user.Id, cancellationToken);
        var now = DateTime.UtcNow;
        if (existingLike is null)
        {
            var actorName = "Someone";

            await _likeRepository.AddAsync(new Like
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                UserId = user.Id,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (post.UserId != user.Id)
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = post.UserId,
                    ActorUserId = user.Id,
                    PostId = post.Id,
                    Type = "LIKE",
                    Message = $"{actorName} reacted to your post.",
                    IsRead = false,
                    CreatedAt = now
                }, cancellationToken);
            }
        }
        else
        {
            existingLike.Type = normalizedType;
            existingLike.UpdatedAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var reactionSummary = await ResolveReactionSummaryAsync(post.Id, cancellationToken);

        return new PostReactionStateResponseDto
        {
            PostId = post.Id,
            ReactionType = normalizedType,
            ReactionCount = reactionSummary.Count,
            TopReactionTypes = reactionSummary.TopTypes
        };
    }

    public async Task<PostReactionStateResponseDto> RemoveReactionAsync(
        Guid postId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var existingLike = await _likeRepository.GetByPostAndUserAsync(post.Id, userId, cancellationToken);
        if (existingLike is not null)
        {
            _likeRepository.Remove(existingLike);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var reactionSummary = await ResolveReactionSummaryAsync(post.Id, cancellationToken);

        return new PostReactionStateResponseDto
        {
            PostId = post.Id,
            ReactionType = null,
            ReactionCount = reactionSummary.Count,
            TopReactionTypes = reactionSummary.TopTypes
        };
    }

    public async Task<LikeStateResponseDto> LikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
    {
        var state = await SetReactionAsync(
            postId,
            userId,
            new SetPostReactionRequestDto { Type = PostReactionTypes.Like },
            cancellationToken);

        return new LikeStateResponseDto
        {
            PostId = state.PostId,
            Liked = true,
            LikeCount = state.ReactionCount
        };
    }

    public async Task<LikeStateResponseDto> UnlikeAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
    {
        var state = await RemoveReactionAsync(postId, userId, cancellationToken);

        return new LikeStateResponseDto
        {
            PostId = state.PostId,
            Liked = false,
            LikeCount = state.ReactionCount
        };
    }

    private async Task<ReactionSummary> ResolveReactionSummaryAsync(Guid postId, CancellationToken cancellationToken)
    {
        var reactions = await _likeRepository.GetByPostIdAsync(postId, cancellationToken);
        if (reactions.Count == 0)
        {
            return new ReactionSummary(0, Array.Empty<string>());
        }

        var topTypes = reactions
            .GroupBy(reaction => NormalizeReactionType(reaction.Type))
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key, StringComparer.Ordinal)
            .Take(3)
            .Select(group => group.Key)
            .ToList();

        return new ReactionSummary(reactions.Count, topTypes);
    }

    private static string NormalizeReactionType(string? type)
    {
        return PostReactionTypes.IsValid(type)
            ? PostReactionTypes.Normalize(type!)
            : PostReactionTypes.Like;
    }

    private async Task<Dictionary<Guid, UserProfileSummaryDto?>> ResolveProfileLookupAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var distinctIds = userIds.Distinct().ToList();
        if (distinctIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto?>();
        }

        var profileTasks = distinctIds.Select(async userId =>
        {
            try
            {
                var profile = await _javaApiService.GetProfileSummaryByUserId(userId, cancellationToken: cancellationToken);
                return new KeyValuePair<Guid, UserProfileSummaryDto?>(userId, profile);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                _logger.LogWarning(
                    exception,
                    "Failed to resolve profile summary while loading post reactions for user {UserId}.",
                    userId);

                return new KeyValuePair<Guid, UserProfileSummaryDto?>(userId, null);
            }
        });

        var results = await Task.WhenAll(profileTasks);
        return results.ToDictionary(item => item.Key, item => item.Value);
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}

using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class CommentReactionService : ICommentReactionService
{
    private const string CommentReactionNotificationType = "COMMENT_REACTION";

    private readonly ICommentRepository _commentRepository;
    private readonly ICommentReactionRepository _commentReactionRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentReactionService> _logger;

    public CommentReactionService(
        ICommentRepository commentRepository,
        ICommentReactionRepository commentReactionRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUnitOfWork unitOfWork,
        ILogger<CommentReactionService> logger)
    {
        _commentRepository = commentRepository;
        _commentReactionRepository = commentReactionRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CommentReactionUsersResponseDto> GetReactionUsersAsync(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        var reactions = await _commentReactionRepository.GetByCommentIdAsync(comment.Id, cancellationToken);
        if (reactions.Count == 0)
        {
            return new CommentReactionUsersResponseDto
            {
                CommentId = comment.Id,
                TotalCount = 0,
                Users = Array.Empty<CommentReactionUserDto>()
            };
        }

        var userProfiles = await ResolveProfileLookupAsync(reactions.Select(reaction => reaction.UserId), cancellationToken);

        var users = reactions
            .Select(reaction =>
            {
                var profile = userProfiles.TryGetValue(reaction.UserId, out var item)
                    ? item
                    : null;
                var displayName = profile?.DisplayName.TrimToNull() ?? "user";
                var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(reaction.UserId);

                return new CommentReactionUserDto
                {
                    UserId = reaction.UserId,
                    DisplayName = displayName,
                    AvatarUrl = avatarUrl,
                    ReactionType = reaction.Type.ToString(),
                    ReactedAt = reaction.UpdatedAt
                };
            })
            .ToList();

        return new CommentReactionUsersResponseDto
        {
            CommentId = comment.Id,
            TotalCount = users.Count,
            Users = users
        };
    }

    public async Task<CommentReactionStateResponseDto> SetReactionAsync(
        Guid commentId,
        Guid userId,
        SetCommentReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new ArgumentException("Reaction type is invalid.");
        }

        var existingReaction = await _commentReactionRepository.GetByCommentAndUserAsync(comment.Id, user.Id, cancellationToken);
        Notification? createdNotification = null;
        string? notificationActorDisplayName = null;
        string? notificationActorAvatarUrl = null;

        if (existingReaction is null)
        {
            var now = DateTime.UtcNow;
            await _commentReactionRepository.AddAsync(new CommentReaction
            {
                Id = Guid.NewGuid(),
                CommentId = comment.Id,
                UserId = user.Id,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (comment.UserId != user.Id)
            {
                var actorSummary = await ResolveNotificationActorSummaryAsync(user.Id, cancellationToken);
                notificationActorDisplayName = actorSummary.DisplayName;
                notificationActorAvatarUrl = actorSummary.AvatarUrl;

                createdNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = comment.UserId,
                    ActorUserId = user.Id,
                    PostId = comment.PostId,
                    CommentId = comment.Id,
                    Type = CommentReactionNotificationType,
                    Message = $"{actorSummary.DisplayName} reacted to your comment.",
                    IsRead = false,
                    CreatedAt = now
                };

                await _notificationRepository.AddAsync(createdNotification, cancellationToken);
            }
        }
        else
        {
            existingReaction.Type = normalizedType;
            existingReaction.UpdatedAt = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (createdNotification is not null)
        {
            await _notificationRealtimeService.NotifyCreatedAsync(
                createdNotification.ToResponseDto(notificationActorDisplayName, notificationActorAvatarUrl),
                cancellationToken);
        }

        return new CommentReactionStateResponseDto
        {
            CommentId = comment.Id,
            ReactionType = normalizedType.ToString()
        };
    }

    public async Task<CommentReactionStateResponseDto> RemoveReactionAsync(
        Guid commentId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        var existingReaction = await _commentReactionRepository.GetByCommentAndUserAsync(comment.Id, userId, cancellationToken);
        if (existingReaction is not null)
        {
            _commentReactionRepository.Remove(existingReaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new CommentReactionStateResponseDto
        {
            CommentId = comment.Id,
            ReactionType = null
        };
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
                    "Failed to resolve profile summary while loading comment reactions for user {UserId}.",
                    userId);

                return new KeyValuePair<Guid, UserProfileSummaryDto?>(userId, null);
            }
        });

        var results = await Task.WhenAll(profileTasks);
        return results.ToDictionary(item => item.Key, item => item.Value);
    }

    private async Task<(string DisplayName, string AvatarUrl)> ResolveNotificationActorSummaryAsync(
        Guid actorUserId,
        CancellationToken cancellationToken)
    {
        try
        {
            var profile = await _javaApiService.GetProfileSummaryByUserId(actorUserId, cancellationToken: cancellationToken);
            var displayName = profile?.DisplayName.TrimToNull() ?? "Someone";
            var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(actorUserId);
            return (displayName, avatarUrl);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not resolve actor summary while creating comment reaction notification for user {ActorUserId}.",
                actorUserId);

            return ("Someone", AvatarUrlHelper.BuildDefaultAvatarUrl(actorUserId));
        }
    }

}

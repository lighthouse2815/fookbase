using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class CommentReactionService : ICommentReactionService
{
    private readonly ICommentRepository _commentRepository;
    private readonly ICommentReactionRepository _commentReactionRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentReactionService> _logger;

    public CommentReactionService(
        ICommentRepository commentRepository,
        ICommentReactionRepository commentReactionRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<CommentReactionService> logger)
    {
        _commentRepository = commentRepository;
        _commentReactionRepository = commentReactionRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CommentReactionUsersResponseDto> GetReactionUsersAsync(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        var reactions = await _commentReactionRepository.GetByCommentIdAsync(comment.Id, cancellationToken);
        if (reactions.Count == 0)
        {
            return CommentReactionMapper.ToUsersResponseDto(comment.Id, Array.Empty<CommentReactionUserDto>());
        }

        var userProfiles = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            reactions.Select(reaction => reaction.UserId),
            cancellationToken,
            requireFresh: false);

        var users = reactions
            .Select(reaction =>
            {
                var profile = userProfiles.TryGetValue(reaction.UserId, out var item)
                    ? item
                    : null;
                return reaction.ToUserDto(profile);
            })
            .ToList();

        return CommentReactionMapper.ToUsersResponseDto(comment.Id, users);
    }

    public async Task<CommentReactionStateResponseDto> SetReactionAsync(
        Guid commentId,
        Guid userId,
        SetCommentReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new BusinessException(ErrorCode.INVALID_REACTION_TYPE);
        }

        var existingReaction = await _commentReactionRepository.GetByCommentAndUserAsync(comment.Id, userId, cancellationToken);
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
                UserId = userId,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (comment.UserId != userId)
            {
                var actorProfileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
                    [userId],
                    cancellationToken,
                    requireFresh: false);
                var actorProfile = actorProfileLookup.TryGetValue(userId, out var profile) ? profile : null;
                var actorSummary = UserProfileSummaryMapper.ToAuthorSummary(
                    userId,
                    actorProfile,
                    fallbackDisplayName: "Someone");
                notificationActorDisplayName = actorSummary.DisplayName;
                notificationActorAvatarUrl = actorSummary.AvatarUrl;

                createdNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = comment.UserId,
                    ActorUserId = userId,
                    PostId = comment.PostId,
                    CommentId = comment.Id,
                    Type = NotificationType.COMMENT_REACTION,
                    Message = $"{actorSummary.DisplayName} reacted to your comment.",
                    IsRead = false,
                    CreatedAt = now,
                    UpdatedAt = now
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

        return CommentReactionMapper.ToStateResponseDto(comment.Id, normalizedType);
    }

    public async Task<CommentReactionStateResponseDto> RemoveReactionAsync(
        Guid commentId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        var existingReaction = await _commentReactionRepository.GetByCommentAndUserAsync(comment.Id, userId, cancellationToken);
        if (existingReaction is not null)
        {
            _commentReactionRepository.Remove(existingReaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return CommentReactionMapper.ToStateResponseDto(comment.Id, reactionType: null);
    }

}







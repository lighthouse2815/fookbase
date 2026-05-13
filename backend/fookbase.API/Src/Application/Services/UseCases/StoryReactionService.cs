using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Services;

public class StoryReactionService : IStoryReactionService
{
    private readonly IStoryRepository _storyRepository;
    private readonly IStoryReactionRepository _storyReactionRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;

    public StoryReactionService(
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork)
    {
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
    }

    public async Task<StoryReactionStateResponseDto> SetReactionAsync(
        Guid storyId,
        Guid userId,
        SetStoryReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new BusinessException(ErrorCode.INVALID_REACTION_TYPE);
        }

        var existingReaction = await _storyReactionRepository.GetByStoryAndUserAsync(story.Id, userId, cancellationToken);
        Notification? createdNotification = null;
        string? notificationActorDisplayName = null;
        string? notificationActorAvatarUrl = null;

        if (existingReaction is null)
        {
            var now = DateTime.UtcNow;
            await _storyReactionRepository.AddAsync(new StoryReaction
            {
                Id = Guid.NewGuid(),
                StoryId = story.Id,
                UserId = userId,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (story.UserId != userId)
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
                    UserId = story.UserId,
                    ActorUserId = userId,
                    StoryId = story.Id,
                    Type = NotificationType.STORY_REACTION,
                    Message = $"{actorSummary.DisplayName} reacted to your story.",
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

        return StoryReactionMapper.ToStateResponseDto(story.Id, normalizedType);
    }

    public async Task<StoryReactionStateResponseDto> RemoveReactionAsync(
        Guid storyId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }

        var existingReaction = await _storyReactionRepository.GetByStoryAndUserAsync(story.Id, userId, cancellationToken);
        if (existingReaction is not null)
        {
            _storyReactionRepository.Remove(existingReaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return StoryReactionMapper.ToStateResponseDto(story.Id, reactionType: null);
    }

}

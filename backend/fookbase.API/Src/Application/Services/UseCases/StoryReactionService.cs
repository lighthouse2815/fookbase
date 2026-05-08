using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Services;

public class StoryReactionService : IStoryReactionService
{
    private const NotificationType StoryReactionNotificationType = NotificationType.STORY_REACTION;

    private readonly IStoryRepository _storyRepository;
    private readonly IStoryReactionRepository _storyReactionRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly IUnitOfWork _unitOfWork;

    public StoryReactionService(
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserReadModelService userReadModelService,
        IUnitOfWork unitOfWork)
    {
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userReadModelService = userReadModelService;
        _unitOfWork = unitOfWork;
    }

    public async Task<StoryReactionStateResponseDto> SetReactionAsync(
        Guid storyId,
        Guid userId,
        SetStoryReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_NOT_FOUND);

        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        EnsureStoryIsActive(story);

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new BusinessException(ErrorCode.INVALID_REACTION_TYPE);
        }

        var now = DateTime.UtcNow;
        var existingReaction = await _storyReactionRepository.GetByStoryAndUserAsync(story.Id, user.Id, cancellationToken);
        Notification? createdNotification = null;
        string? notificationActorDisplayName = null;
        string? notificationActorAvatarUrl = null;

        if (existingReaction is null)
        {
            await _storyReactionRepository.AddAsync(new StoryReaction
            {
                Id = Guid.NewGuid(),
                StoryId = story.Id,
                UserId = user.Id,
                Type = normalizedType,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);

            if (story.UserId != user.Id)
            {
                var actorSummary = await ResolveActorSummaryAsync(user.Id, cancellationToken);
                notificationActorDisplayName = actorSummary.DisplayName;
                notificationActorAvatarUrl = actorSummary.AvatarUrl;
                createdNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = story.UserId,
                    ActorUserId = user.Id,
                    StoryId = story.Id,
                    Type = StoryReactionNotificationType,
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
            existingReaction.UpdatedAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (createdNotification is not null)
        {
            await _notificationRealtimeService.NotifyCreatedAsync(
                createdNotification.ToResponseDto(notificationActorDisplayName, notificationActorAvatarUrl),
                cancellationToken);
        }

        return new StoryReactionStateResponseDto
        {
            StoryId = story.Id,
            ReactionType = normalizedType.ToString()
        };
    }

    public async Task<StoryReactionStateResponseDto> RemoveReactionAsync(
        Guid storyId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        EnsureStoryIsActive(story);

        var existingReaction = await _storyReactionRepository.GetByStoryAndUserAsync(story.Id, userId, cancellationToken);
        if (existingReaction is not null)
        {
            _storyReactionRepository.Remove(existingReaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new StoryReactionStateResponseDto
        {
            StoryId = story.Id,
            ReactionType = null
        };
    }

    private async Task<(string DisplayName, string AvatarUrl)> ResolveActorSummaryAsync(
        Guid actorUserId,
        CancellationToken cancellationToken)
    {
        var summary = await _userReadModelService.ResolveAuthorAsync(
            actorUserId,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "Someone");

        return (summary.DisplayName, summary.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(actorUserId));
    }

    private static void EnsureStoryIsActive(Story story)
    {
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }
    }
}

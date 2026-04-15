using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class StoryReactionService : IStoryReactionService
{
    private const string StoryReactionNotificationType = "STORY_REACTION";

    private readonly IStoryRepository _storyRepository;
    private readonly IStoryReactionRepository _storyReactionRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUnitOfWork _unitOfWork;

    public StoryReactionService(
        IStoryRepository storyRepository,
        IStoryReactionRepository storyReactionRepository,
        IJavaApiService javaApiService,
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUnitOfWork unitOfWork)
    {
        _storyRepository = storyRepository;
        _storyReactionRepository = storyReactionRepository;
        _javaApiService = javaApiService;
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _unitOfWork = unitOfWork;
    }

    public async Task<StoryReactionStateResponseDto> SetReactionAsync(
        Guid storyId,
        Guid userId,
        SetStoryReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");
        EnsureStoryIsActive(story);

        if (!EnumParser.TryParseReactionType(request.Type, out var normalizedType))
        {
            throw new ArgumentException("Reaction type is invalid.");
        }

        var now = DateTime.UtcNow;
        var existingReaction = await _storyReactionRepository.GetByStoryAndUserAsync(story.Id, user.Id, cancellationToken);
        Notification? createdNotification = null;

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
                var actorName = await ResolveActorDisplayNameAsync(user.Id, cancellationToken);
                createdNotification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = story.UserId,
                    ActorUserId = user.Id,
                    Type = StoryReactionNotificationType,
                    Message = $"{actorName} reacted to your story.",
                    IsRead = false,
                    CreatedAt = now
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
            await _notificationRealtimeService.NotifyCreatedAsync(createdNotification.ToResponseDto(), cancellationToken);
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
            ?? throw new NotFoundException("Story not found.");
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

    private async Task<string> ResolveActorDisplayNameAsync(Guid actorUserId, CancellationToken cancellationToken)
    {
        try
        {
            var profile = await _javaApiService.GetProfileSummaryByUserId(actorUserId, cancellationToken: cancellationToken);
            return profile?.DisplayName.TrimToNull() ?? "Someone";
        }
        catch
        {
            return "Someone";
        }
    }

    private static void EnsureStoryIsActive(Story story)
    {
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new NotFoundException("Story not found.");
        }
    }
}

using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUserIdentityReadModelService _userIdentityReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationRealtimeService notificationRealtimeService,
        IUserIdentityReadModelService userIdentityReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _notificationRealtimeService = notificationRealtimeService;
        _userIdentityReadModelService = userIdentityReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<NotificationResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _notificationRepository.GetPagedByUserIdAsync(userId, query.Page, query.PageSize, cancellationToken);
        var mappedItems = await MapNotificationAsync(items, cancellationToken);

        return PagedResult<NotificationResponseDto>.Create(
            mappedItems,
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<NotificationResponseDto> GetByIdAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);

        if (notification.UserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to access this notification.");
        }

        var mappedItems = await MapNotificationAsync([notification], cancellationToken);
        return mappedItems[0];
    }

    public async Task<NotificationResponseDto> CreateAsync(CreateNotificationRequestDto request, CancellationToken cancellationToken)
    {
        if (!EnumParser.TryParseNotificationType(request.Type, out var notificationType))
        {
            throw new BusinessException(ErrorCode.INVALID_NOTIFICATION_TYPE);
        }

        var targetUserExists = await EnsureUserExistsAsync(
            request.UserId,
            "Could not verify notification target user.",
            cancellationToken);
        if (!targetUserExists)
        {
            throw new BusinessException(ErrorCode.TARGET_USER_NOT_FOUND);
        }

        var actorUserExists = await EnsureUserExistsAsync(
            request.ActorUserId,
            "Could not verify notification actor user.",
            cancellationToken);
        if (!actorUserExists)
        {
            throw new BusinessException(ErrorCode.ACTOR_USER_NOT_FOUND);
        }

        var now = DateTime.UtcNow;

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            ActorUserId = request.ActorUserId,
            PostId = request.PostId,
            CommentId = request.CommentId,
            StoryId = request.StoryId,
            Type = notificationType,
            Message = request.Message.Trim(),
            IsRead = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapNotificationAsync([notification], cancellationToken);
        var response = mappedItems[0];
        await _notificationRealtimeService.NotifyCreatedAsync(response, cancellationToken);

        return response;
    }

    public async Task<NotificationResponseDto> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);

        if (notification.UserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to update this notification.");
        }

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapNotificationAsync([notification], cancellationToken);
        var response = mappedItems[0];
        await _notificationRealtimeService.NotifyUpdatedAsync(response, cancellationToken);

        return response;
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        var unreadNotifications = await _notificationRepository.GetUnreadByUserIdForUpdateAsync(userId, cancellationToken);
        var now = DateTime.UtcNow;
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.UpdatedAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyMarkedAllReadAsync(userId, cancellationToken);
    }

    public async Task DeleteAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);

        if (notification.UserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to delete this notification.");
        }

        _notificationRepository.Remove(notification);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyDeletedAsync(notification.UserId, notification.Id, cancellationToken);
    }

    private async Task<List<NotificationResponseDto>> MapNotificationAsync(
        IReadOnlyList<Notification> notifications,
        CancellationToken cancellationToken)
    {
        if (notifications.Count == 0)
        {
            return [];
        }

        var actorProfiles = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            notifications.Select(notification => notification.ActorUserId),
            cancellationToken,
            requireFresh: false);

        return notifications.ToResponseDtos(actorProfiles);
    }

    private async Task<bool> EnsureUserExistsAsync(
        Guid userId,
        string serviceUnavailableMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _userIdentityReadModelService.ExistsAsync(userId, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not verify user identity for {UserId}.", userId);
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, serviceUnavailableMessage);
        }
    }
}







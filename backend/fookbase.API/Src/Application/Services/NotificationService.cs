using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationRealtimeService _notificationRealtimeService;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        INotificationRepository notificationRepository,
        IJavaApiService javaApiService,
        INotificationRealtimeService notificationRealtimeService,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _javaApiService = javaApiService;
        _notificationRealtimeService = notificationRealtimeService;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NotificationResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _notificationRepository.GetPagedByUserIdAsync(userId, query.Page, query.PageSize, cancellationToken);

        return PagedResult<NotificationResponseDto>.Create(
            items.Select(static notification => notification.ToResponseDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<NotificationResponseDto> GetByIdAsync(
        Guid notificationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to access this notification.");

        return notification.ToResponseDto();
    }

    public async Task<NotificationResponseDto> CreateAsync(CreateNotificationRequestDto request, CancellationToken cancellationToken)
    {
        var targetUser = await _javaApiService.GetUserById(request.UserId, cancellationToken)
            ?? throw new NotFoundException("Target user not found.");

        var actorUser = await _javaApiService.GetUserById(request.ActorUserId, cancellationToken)
            ?? throw new NotFoundException("Actor user not found.");

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            ActorUserId = actorUser.Id,
            PostId = request.PostId,
            CommentId = request.CommentId,
            Type = request.Type.Trim().ToUpperInvariant(),
            Message = request.Message.Trim(),
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = notification.ToResponseDto();
        await _notificationRealtimeService.NotifyCreatedAsync(response, cancellationToken);

        return response;
    }

    public async Task<NotificationResponseDto> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to update this notification.");

        notification.IsRead = true;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = notification.ToResponseDto();
        await _notificationRealtimeService.NotifyUpdatedAsync(response, cancellationToken);

        return response;
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        var unreadNotifications = await _notificationRepository.GetUnreadByUserIdForUpdateAsync(userId, cancellationToken);
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyMarkedAllReadAsync(userId, cancellationToken);
    }

    public async Task DeleteAsync(Guid notificationId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdForUpdateAsync(notificationId, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");

        EnsureOwnerOrAdmin(notification.UserId, userId, isAdmin, "You are not allowed to delete this notification.");

        _notificationRepository.Remove(notification);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationRealtimeService.NotifyDeletedAsync(notification.UserId, notification.Id, cancellationToken);
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
    }

}

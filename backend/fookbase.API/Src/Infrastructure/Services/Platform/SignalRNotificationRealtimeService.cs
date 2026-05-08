using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Api.Infrastructure.Services;

public class SignalRNotificationRealtimeService : INotificationRealtimeService
{
    private readonly IHubContext<NotificationsHub, INotificationsClient> _hubContext;

    public SignalRNotificationRealtimeService(IHubContext<NotificationsHub, INotificationsClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyCreatedAsync(NotificationResponseDto notification, CancellationToken cancellationToken)
    {
        return _hubContext.Clients
            .Group(NotificationsHub.BuildUserGroupName(notification.UserId))
            .NotificationCreated(notification);
    }

    public Task NotifyUpdatedAsync(NotificationResponseDto notification, CancellationToken cancellationToken)
    {
        return _hubContext.Clients
            .Group(NotificationsHub.BuildUserGroupName(notification.UserId))
            .NotificationUpdated(notification);
    }

    public Task NotifyDeletedAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken)
    {
        return _hubContext.Clients
            .Group(NotificationsHub.BuildUserGroupName(userId))
            .NotificationDeleted(notificationId);
    }

    public Task NotifyMarkedAllReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _hubContext.Clients
            .Group(NotificationsHub.BuildUserGroupName(userId))
            .NotificationsMarkedAllRead();
    }
}

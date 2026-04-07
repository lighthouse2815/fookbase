using InteractHub.Api.Application.DTOs.Notifications;

namespace InteractHub.Api.Presentation.Hubs;

public interface INotificationsClient
{
    Task NotificationCreated(NotificationResponseDto notification);

    Task NotificationUpdated(NotificationResponseDto notification);

    Task NotificationDeleted(Guid notificationId);

    Task NotificationsMarkedAllRead();
}

using InteractHub.Api.Application.DTOs.Notifications;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface INotificationRealtimeService
{
    Task NotifyCreatedAsync(NotificationResponseDto notification, CancellationToken cancellationToken);

    Task NotifyUpdatedAsync(NotificationResponseDto notification, CancellationToken cancellationToken);

    Task NotifyDeletedAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken);

    Task NotifyMarkedAllReadAsync(Guid userId, CancellationToken cancellationToken);
}




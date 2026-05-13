using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface INotificationService
{
    Task<PagedResult<NotificationResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<NotificationResponseDto> GetByIdAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken);

    Task<NotificationResponseDto> CreateAsync(CreateNotificationRequestDto request, CancellationToken cancellationToken);

    Task<NotificationResponseDto> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken);

    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken);

    Task DeleteAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken);
}



using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<(IReadOnlyList<Notification> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);

    Task<Notification?> GetByIdAsync(Guid notificationId, CancellationToken cancellationToken);

    Task<Notification?> GetByIdForUpdateAsync(Guid notificationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Notification>> GetUnreadByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken);

    Task AddAsync(Notification notification, CancellationToken cancellationToken);

    void Remove(Notification notification);
}

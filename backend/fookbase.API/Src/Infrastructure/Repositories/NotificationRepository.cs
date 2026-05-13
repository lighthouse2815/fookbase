using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Notification> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Notification?> GetByIdAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        return _context.Notifications
            .AsNoTracking()
            .FirstOrDefaultAsync(notification => notification.Id == notificationId, cancellationToken);
    }

    public Task<Notification?> GetByIdForUpdateAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        return _context.Notifications
            .FirstOrDefaultAsync(notification => notification.Id == notificationId, cancellationToken);
    }

    public async Task<IReadOnlyList<Notification>> GetUnreadByUserIdForUpdateAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(Notification notification, CancellationToken cancellationToken)
    {
        return _context.Notifications.AddAsync(notification, cancellationToken).AsTask();
    }

    public void Remove(Notification notification)
    {
        _context.Notifications.Remove(notification);
    }
}



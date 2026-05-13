using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class AdminAuditLogRepository : IAdminAuditLogRepository
{
    private readonly AppDbContext _context;

    public AdminAuditLogRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<AdminAuditLog> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.AdminAuditLogs
            .AsNoTracking()
            .OrderByDescending(log => log.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(AdminAuditLog log, CancellationToken cancellationToken)
    {
        await _context.AdminAuditLogs.AddAsync(log, cancellationToken);
    }
}

 




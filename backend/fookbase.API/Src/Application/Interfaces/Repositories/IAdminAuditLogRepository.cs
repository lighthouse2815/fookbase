using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IAdminAuditLogRepository
{
    Task<(IReadOnlyList<AdminAuditLog> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task AddAsync(AdminAuditLog log, CancellationToken cancellationToken);
}


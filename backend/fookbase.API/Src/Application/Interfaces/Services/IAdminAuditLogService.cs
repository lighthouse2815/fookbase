using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAdminAuditLogService
{
    Task<PagedResult<AdminAuditLogResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task LogAsync(
        Guid adminUserId,
        string actionType,
        string entityType,
        Guid? entityId,
        Guid? targetUserId,
        string? details,
        CancellationToken cancellationToken);
}


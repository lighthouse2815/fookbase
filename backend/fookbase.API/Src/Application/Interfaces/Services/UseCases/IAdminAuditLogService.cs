using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAdminAuditLogService
{
    Task<PagedResult<AdminAuditLogResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task CreateAdminAuditLogAsync(
        Guid adminUserId,
        AdminAuditActionType actionType,
        AdminAuditEntityType entityType,
        Guid entityId,
        Guid targetUserId,
        string details,
        CancellationToken cancellationToken);
}


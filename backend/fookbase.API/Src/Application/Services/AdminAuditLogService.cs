using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class AdminAuditLogService : IAdminAuditLogService
{
    private readonly IAdminAuditLogRepository _adminAuditLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminAuditLogService(
        IAdminAuditLogRepository adminAuditLogRepository,
        IUnitOfWork unitOfWork)
    {
        _adminAuditLogRepository = adminAuditLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<AdminAuditLogResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _adminAuditLogRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        var mappedItems = items.Select(static log => log.ToResponseDto()).ToList();

        return PagedResult<AdminAuditLogResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task LogAsync(
        Guid adminUserId,
        string actionType,
        string entityType,
        Guid? entityId,
        Guid? targetUserId,
        string? details,
        CancellationToken cancellationToken)
    {
        var log = new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            ActionType = actionType.Trim().ToUpperInvariant(),
            EntityType = entityType.Trim().ToUpperInvariant(),
            EntityId = entityId,
            TargetUserId = targetUserId,
            Details = string.IsNullOrWhiteSpace(details) ? null : details.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _adminAuditLogRepository.AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

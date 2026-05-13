using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

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

        var (adminAuditLogList, totalCount) = await _adminAuditLogRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            cancellationToken
        );

        var responseList = adminAuditLogList.Select(
            static adminAuditLog => adminAuditLog.ToResponseDto()
        ).ToList();

        return PagedResult<AdminAuditLogResponseDto>.Create(responseList, query.Page, query.PageSize, totalCount);
    }
 
    public async Task CreateAdminAuditLogAsync(
        Guid adminUserId,
        AdminAuditActionType actionType,
        AdminAuditEntityType entityType,
        Guid entityId,
        Guid targetUserId,
        string details,
        CancellationToken cancellationToken)
    {
        if (adminUserId == Guid.Empty)
        {
            throw new BusinessException(ErrorCode.ADMIN_USER_ID_REQUIRED);
        }

        if (entityId == Guid.Empty)
        {
            throw new BusinessException(ErrorCode.ENTITY_ID_REQUIRED);
        }

        if (targetUserId == Guid.Empty)
        {
            throw new BusinessException(ErrorCode.TARGET_USER_ID_REQUIRED);
        }

        if (string.IsNullOrWhiteSpace(details))
        {
            throw new BusinessException(ErrorCode.AUDIT_DETAILS_REQUIRED);
        }

        var log = new AdminAuditLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            TargetUserId = targetUserId,
            Details = details.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _adminAuditLogRepository.AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}




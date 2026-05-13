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
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IUnitOfWork _unitOfWork;

    public AdminAuditLogService(
        IAdminAuditLogRepository adminAuditLogRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IUnitOfWork unitOfWork)
    {
        _adminAuditLogRepository = adminAuditLogRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
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

        var userIds = adminAuditLogList
            .Select(log => log.AdminUserId)
            .Concat(adminAuditLogList.Select(log => log.TargetUserId))
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);

        var responseList = adminAuditLogList.Select(
            adminAuditLog =>
            {
                var adminProfile = profileLookup.TryGetValue(adminAuditLog.AdminUserId, out var adminValue)
                    ? adminValue
                    : null;
                var targetProfile = profileLookup.TryGetValue(adminAuditLog.TargetUserId, out var targetValue)
                    ? targetValue
                    : null;

                return adminAuditLog.ToResponseDto(
                    admin: UserProfileSummaryMapper.ToAuthorSummary(
                        adminAuditLog.AdminUserId,
                        adminProfile,
                        fallbackDisplayName: "admin"),
                    targetUser: UserProfileSummaryMapper.ToAuthorSummary(
                        adminAuditLog.TargetUserId,
                        targetProfile,
                        fallbackDisplayName: "user"));
            }
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




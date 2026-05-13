using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class UserReportService : IUserReportService
{
    private readonly IUserReportRepository _userReportRepository;
    private readonly IJavaAdminApiService _javaAdminApiService;
    private readonly IUserIdentityReadModelService _userIdentityReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UserReportService> _logger;

    public UserReportService(
        IUserReportRepository userReportRepository,
        IJavaAdminApiService javaAdminApiService,
        IUserIdentityReadModelService userIdentityReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<UserReportService> logger)
    {
        _userReportRepository = userReportRepository;
        _javaAdminApiService = javaAdminApiService;
        _userIdentityReadModelService = userIdentityReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _notificationService = notificationService;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<UserReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _userReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<UserReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<UserReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _userReportRepository.GetPagedByReporterAsync(userId, query.Page, query.PageSize, cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<UserReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public Task<int> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        return _userReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
    }

    public async Task<UserReportResponseDto> GetByIdAsync(
        Guid reportId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var report = await _userReportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to access this user report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<UserReportResponseDto> CreateAsync(Guid userId, CreateUserReportRequestDto request, CancellationToken cancellationToken)
    {
        if (userId == request.TargetUserId)
        {
            throw new BusinessException(ErrorCode.CANNOT_REPORT_SELF);
        }

        var targetUserExists = await EnsureUserExistsAsync(
            request.TargetUserId,
            "Could not verify report target user.",
            cancellationToken);
        if (!targetUserExists)
        {
            throw new BusinessException(ErrorCode.TARGET_USER_NOT_FOUND);
        }

        var hasPendingReport = await _userReportRepository.ExistsByTargetAndReporterAsync(request.TargetUserId, userId, cancellationToken);
        if (hasPendingReport)
        {
            throw new BusinessException(ErrorCode.DUPLICATE_USER_REPORT);
        }

        var now = DateTime.UtcNow;
        var report = new UserReport
        {
            Id = Guid.NewGuid(),
            TargetUserId = request.TargetUserId,
            ReportedByUserId = userId,
            Reason = request.Reason.Trim(),
            Status = ReportStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _userReportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<UserReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveUserReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var report = await _userReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_REPORT_NOT_FOUND);

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || (normalizedStatus is not ReportStatus.RESOLVED and not ReportStatus.REJECTED))
        {
            throw new BusinessException(ErrorCode.INVALID_REPORT_STATUS);
        }

        var previousStatus = report.Status;
        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var statusUpdateResult = await _javaAdminApiService.UpdateAdminUserStatusAsync(
                report.TargetUserId,
                UserStatus.BANNED,
                accessToken: null,
                cancellationToken: cancellationToken);

            if (!statusUpdateResult.IsSuccess || statusUpdateResult.Data is null)
            {
                var errorMessage = JavaApiResultHelper.ResolveErrorMessage(
                    statusUpdateResult.ErrorMessage,
                    "Could not ban reported user.");
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, errorMessage);
            }
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUserId;
        report.UpdatedAt = DateTime.UtcNow;

        await CreateResolveNotificationsAsync(report, adminUserId, normalizedStatus, cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            normalizedStatus == ReportStatus.RESOLVED
                ? AdminAuditActionType.USER_REPORT_APPROVED
                : AdminAuditActionType.USER_REPORT_REJECTED,
            AdminAuditEntityType.USER_REPORT,
            report.Id,
            report.TargetUserId,
            $"UserReportId={report.Id};TargetUserId={report.TargetUserId};Previous={previousStatus};Current={normalizedStatus}.",
            cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _userReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to delete this user report.");
        }

        _userReportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<UserReportResponseDto>> MapReportsAsync(
        IReadOnlyList<UserReport> reports,
        CancellationToken cancellationToken)
    {
        if (reports.Count == 0)
        {
            return [];
        }

        var userIds = reports
            .Select(report => report.ReportedByUserId)
            .Concat(reports.Select(report => report.TargetUserId))
            .Distinct()
            .ToList();

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);

        return UserReportMapper.ToResponseDtos(
            reports,
            profileLookup,
            fallbackDisplayName: "user");
    }

    private async Task CreateResolveNotificationsAsync(
        UserReport report,
        Guid adminUserId,
        ReportStatus status,
        CancellationToken cancellationToken)
    {
        if (status == ReportStatus.RESOLVED)
        {
            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = report.ReportedByUserId,
                    ActorUserId = adminUserId,
                    Type = NotificationType.USER_REPORT_APPROVED.ToString(),
                    Message = ReportNotificationMessageConstants.User.ReporterApproved
                },
                cancellationToken);

            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = report.TargetUserId,
                    ActorUserId = adminUserId,
                    Type = NotificationType.USER_REPORT_TARGET_ACTION.ToString(),
                    Message = ReportNotificationMessageConstants.User.TargetRemoved
                },
                cancellationToken);

            return;
        }

        await _notificationService.CreateAsync(
            new CreateNotificationRequestDto
            {
                UserId = report.ReportedByUserId,
                ActorUserId = adminUserId,
                Type = NotificationType.USER_REPORT_REJECTED.ToString(),
                Message = ReportNotificationMessageConstants.User.ReporterRejected
            },
            cancellationToken);
    }

    private async Task<bool> EnsureUserExistsAsync(
        Guid userId,
        string serviceUnavailableMessage,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _userIdentityReadModelService.ExistsAsync(userId, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not verify user identity for {UserId}.", userId);
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, serviceUnavailableMessage);
        }
    }
}

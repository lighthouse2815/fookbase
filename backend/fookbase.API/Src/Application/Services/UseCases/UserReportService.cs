using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
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
    private static readonly HashSet<ReportStatus> AllowedResolveStatuses =
    [
        ReportStatus.RESOLVED,
        ReportStatus.REJECTED
    ];

    private readonly IUserReportRepository _userReportRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UserReportService> _logger;

    private const NotificationType UserReportApprovedNotificationType = NotificationType.USER_REPORT_APPROVED;
    private const NotificationType UserReportRejectedNotificationType = NotificationType.USER_REPORT_REJECTED;
    private const NotificationType UserReportTargetNotificationType = NotificationType.USER_REPORT_TARGET_ACTION;

    public UserReportService(
        IUserReportRepository userReportRepository,
        IJavaApiService javaApiService,
        IUserReadModelService userReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<UserReportService> logger)
    {
        _userReportRepository = userReportRepository;
        _javaApiService = javaApiService;
        _userReadModelService = userReadModelService;
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
        var reporter = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_NOT_FOUND);

        var targetUser = await _javaApiService.GetUserById(request.TargetUserId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.TARGET_USER_NOT_FOUND);

        if (reporter.Id == targetUser.Id)
        {
            throw new BusinessException(ErrorCode.CANNOT_REPORT_SELF);
        }

        var hasPendingReport = await _userReportRepository.ExistsByTargetAndReporterAsync(targetUser.Id, reporter.Id, cancellationToken);
        if (hasPendingReport)
        {
            throw new BusinessException(ErrorCode.DUPLICATE_USER_REPORT);
        }

        var now = DateTime.UtcNow;
        var report = new UserReport
        {
            Id = Guid.NewGuid(),
            TargetUserId = targetUser.Id,
            ReportedByUserId = reporter.Id,
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
        var adminUser = await _javaApiService.GetUserById(adminUserId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND);

        var report = await _userReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.USER_REPORT_NOT_FOUND);

        var previousStatus = report.Status;
        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || !AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new BusinessException(ErrorCode.INVALID_REPORT_STATUS);
        }

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var statusUpdateResult = await _javaApiService.UpdateAdminUserStatusAsync(
                report.TargetUserId,
                "BANNED",
                accessToken: null,
                cancellationToken: cancellationToken);

            if (!statusUpdateResult.IsSuccess || statusUpdateResult.Data is null)
            {
                var errorMessage = string.IsNullOrWhiteSpace(statusUpdateResult.ErrorMessage)
                    ? "Could not ban reported user."
                    : statusUpdateResult.ErrorMessage;
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, errorMessage);
            }
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUser.Id;
        report.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await TryCreateResolveNotificationsAsync(report, adminUserId, normalizedStatus, cancellationToken);

        try
        {
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
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist audit log for user report resolution. ReportId={ReportId}", report.Id);
        }

        _logger.LogInformation(
            "Admin moderation action on user report. AdminUserId={AdminUserId}, ReportId={ReportId}, TargetUserId={TargetUserId}, ReporterUserId={ReporterUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}, ResolvedAt={ResolvedAt}.",
            adminUser.Id,
            report.Id,
            report.TargetUserId,
            report.ReportedByUserId,
            previousStatus,
            report.Status,
            report.ResolvedAt);

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

        var summaries = await _userReadModelService.ResolveAuthorsAsync(
            userIds,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");

        return reports
            .Select(report => report.ToResponseDto(
                reporter: ResolveSummaryOrFallback(report.ReportedByUserId, summaries),
                targetUser: ResolveSummaryOrFallback(report.TargetUserId, summaries)))
            .ToList();
    }

    private async Task TryCreateResolveNotificationsAsync(
        UserReport report,
        Guid adminUserId,
        ReportStatus status,
        CancellationToken cancellationToken)
    {
        try
        {
            if (status == ReportStatus.RESOLVED)
            {
                await _notificationService.CreateAsync(
                    new CreateNotificationRequestDto
                    {
                        UserId = report.ReportedByUserId,
                        ActorUserId = adminUserId,
                        Type = UserReportApprovedNotificationType.ToString(),
                        Message = "Bao cao user da duoc duyet. Tai khoan bi bao cao da bi khoa. / Your user report was approved and the reported account was banned."
                    },
                    cancellationToken);

                if (report.TargetUserId != report.ReportedByUserId)
                {
                    await _notificationService.CreateAsync(
                        new CreateNotificationRequestDto
                        {
                            UserId = report.TargetUserId,
                            ActorUserId = adminUserId,
                            Type = UserReportTargetNotificationType.ToString(),
                            Message = "Tai khoan cua ban da bi khoa do vi pham. / Your account was banned due to policy violations."
                        },
                        cancellationToken);
                }

                return;
            }

            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = report.ReportedByUserId,
                    ActorUserId = adminUserId,
                    Type = UserReportRejectedNotificationType.ToString(),
                    Message = "Bao cao user da bi tu choi sau khi xem xet. / Your user report was rejected after review."
                },
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not create user report resolve notifications. ReportId={ReportId}, Status={Status}.",
                report.Id,
                status);
        }
    }

    private static AuthorSummaryDto ResolveSummaryOrFallback(Guid userId, IReadOnlyDictionary<Guid, AuthorSummaryDto> summaries)
    {
        if (summaries.TryGetValue(userId, out var summary))
        {
            return summary;
        }

        return BuildFallbackSummary(userId);
    }

    private static AuthorSummaryDto BuildFallbackSummary(Guid userId)
    {
        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = "user",
            AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
        };
    }
}

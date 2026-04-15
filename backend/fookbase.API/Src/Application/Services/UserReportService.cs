using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
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
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UserReportService> _logger;

    public UserReportService(
        IUserReportRepository userReportRepository,
        IJavaApiService javaApiService,
        IUnitOfWork unitOfWork,
        ILogger<UserReportService> logger)
    {
        _userReportRepository = userReportRepository;
        _javaApiService = javaApiService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<UserReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _userReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);

        return PagedResult<UserReportResponseDto>.Create(
            items.Select(static report => report.ToResponseDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<PagedResult<UserReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _userReportRepository.GetPagedByReporterAsync(userId, query.Page, query.PageSize, cancellationToken);

        return PagedResult<UserReportResponseDto>.Create(
            items.Select(static report => report.ToResponseDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
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
            ?? throw new NotFoundException("User report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to access this user report.");
        }

        return report.ToResponseDto();
    }

    public async Task<UserReportResponseDto> CreateAsync(Guid userId, CreateUserReportRequestDto request, CancellationToken cancellationToken)
    {
        var reporter = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var targetUser = await _javaApiService.GetUserById(request.TargetUserId, cancellationToken)
            ?? throw new NotFoundException("Target user not found.");

        if (reporter.Id == targetUser.Id)
        {
            throw new ArgumentException("You cannot report yourself.");
        }

        var hasPendingReport = await _userReportRepository.ExistsByTargetAndReporterAsync(targetUser.Id, reporter.Id, cancellationToken);
        if (hasPendingReport)
        {
            throw new ArgumentException("You already have a pending report for this user.");
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

        return report.ToResponseDto();
    }

    public async Task<UserReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveUserReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUser = await _javaApiService.GetUserById(adminUserId, cancellationToken)
            ?? throw new NotFoundException("Admin user not found.");

        var report = await _userReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("User report not found.");

        var previousStatus = report.Status;
        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || !AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be RESOLVED or REJECTED.");
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUser.Id;
        report.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Admin moderation action on user report. AdminUserId={AdminUserId}, ReportId={ReportId}, TargetUserId={TargetUserId}, ReporterUserId={ReporterUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}, ResolvedAt={ResolvedAt}.",
            adminUser.Id,
            report.Id,
            report.TargetUserId,
            report.ReportedByUserId,
            previousStatus,
            report.Status,
            report.ResolvedAt);

        return report.ToResponseDto();
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _userReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("User report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to delete this user report.");
        }

        _userReportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

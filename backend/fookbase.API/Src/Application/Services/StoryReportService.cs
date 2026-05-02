using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.StoryReports;
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

public class StoryReportService : IStoryReportService
{
    private static readonly HashSet<ReportStatus> AllowedResolveStatuses =
    [
        ReportStatus.RESOLVED,
        ReportStatus.REJECTED
    ];

    private const string StoryReportApprovedNotificationType = "STORY_REPORT_APPROVED";
    private const string StoryReportRejectedNotificationType = "STORY_REPORT_REJECTED";
    private const string StoryReportTargetNotificationType = "STORY_REPORT_TARGET_ACTION";

    private readonly IStoryReportRepository _storyReportRepository;
    private readonly IStoryRepository _storyRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<StoryReportService> _logger;

    public StoryReportService(
        IStoryReportRepository storyReportRepository,
        IStoryRepository storyRepository,
        IJavaApiService javaApiService,
        IUserReadModelService userReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<StoryReportService> logger)
    {
        _storyReportRepository = storyReportRepository;
        _storyRepository = storyRepository;
        _javaApiService = javaApiService;
        _userReadModelService = userReadModelService;
        _notificationService = notificationService;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<StoryReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _storyReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<StoryReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<StoryReportResponseDto>> GetMineAsync(
        Guid userId,
        PaginationQuery query,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _storyReportRepository.GetPagedByReporterAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);
        return PagedResult<StoryReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public Task<int> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        return _storyReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
    }

    public async Task<StoryReportResponseDto> GetByIdAsync(
        Guid reportId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var report = await _storyReportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Story report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to access this story report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<StoryReportResponseDto> CreateAsync(
        Guid userId,
        CreateStoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var story = await _storyRepository.GetByIdAsync(request.StoryId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        EnsureStoryIsReportable(story);

        if (story.UserId == user.Id)
        {
            throw new ArgumentException("You cannot report your own story.");
        }

        var hasPendingReport = await _storyReportRepository.ExistsByStoryAndReporterAsync(story.Id, user.Id, cancellationToken);
        if (hasPendingReport)
        {
            throw new ArgumentException("You already have a pending report for this story.");
        }

        var now = DateTime.UtcNow;
        var report = new StoryReport
        {
            Id = Guid.NewGuid(),
            StoryId = story.Id,
            ReportedByUserId = user.Id,
            Reason = request.Reason.Trim(),
            Status = ReportStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _storyReportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<StoryReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveStoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUser = await _javaApiService.GetUserById(adminUserId, cancellationToken)
            ?? throw new NotFoundException("Admin user not found.");

        var report = await _storyReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Story report not found.");

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || !AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be RESOLVED or REJECTED.");
        }

        var ownerMap = await _storyRepository.GetOwnerUserIdsByStoryIdsAsync([report.StoryId], cancellationToken);
        var storyOwnerUserId = ownerMap.TryGetValue(report.StoryId, out var ownerId)
            ? ownerId
            : (Guid?)null;

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var story = await _storyRepository.GetByIdForUpdateAsync(report.StoryId, cancellationToken);
            if (story is not null && !story.IsDeleted)
            {
                story.IsDeleted = true;
            }
        }

        var previousStatus = report.Status;
        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUser.Id;
        report.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await TryCreateResolveNotificationsAsync(report, adminUserId, normalizedStatus, storyOwnerUserId, cancellationToken);

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                normalizedStatus == ReportStatus.RESOLVED ? "STORY_REPORT_APPROVED" : "STORY_REPORT_REJECTED",
                "STORY_REPORT",
                report.Id,
                storyOwnerUserId,
                $"StoryReportId={report.Id};StoryId={report.StoryId};Previous={previousStatus};Current={normalizedStatus}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist audit log for story report resolution. ReportId={ReportId}", report.Id);
        }

        _logger.LogInformation(
            "Admin moderation action on story report. AdminUserId={AdminUserId}, ReportId={ReportId}, StoryId={StoryId}, ReporterUserId={ReporterUserId}, StoryOwnerUserId={StoryOwnerUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}.",
            adminUser.Id,
            report.Id,
            report.StoryId,
            report.ReportedByUserId,
            storyOwnerUserId,
            previousStatus,
            report.Status);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _storyReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Story report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to delete this story report.");
        }

        _storyReportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<StoryReportResponseDto>> MapReportsAsync(
        IReadOnlyList<StoryReport> reports,
        CancellationToken cancellationToken)
    {
        if (reports.Count == 0)
        {
            return [];
        }

        var ownerMap = await _storyRepository.GetOwnerUserIdsByStoryIdsAsync(
            reports.Select(report => report.StoryId).Distinct().ToList(),
            cancellationToken);

        var userIds = reports
            .Select(report => report.ReportedByUserId)
            .Concat(ownerMap.Values)
            .Distinct()
            .ToList();

        var userSummaries = await _userReadModelService.ResolveAuthorsAsync(
            userIds,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");

        return reports
            .Select(report =>
            {
                var storyOwnerUserId = ownerMap.TryGetValue(report.StoryId, out var ownerId) ? ownerId : (Guid?)null;
                return report.ToResponseDto(
                    storyOwnerUserId: storyOwnerUserId,
                    reporter: ResolveSummaryOrFallback(report.ReportedByUserId, userSummaries),
                    storyOwner: storyOwnerUserId.HasValue
                        ? ResolveSummaryOrFallback(storyOwnerUserId.Value, userSummaries)
                        : null);
            })
            .ToList();
    }

    private async Task TryCreateResolveNotificationsAsync(
        StoryReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid? storyOwnerUserId,
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
                        Type = StoryReportApprovedNotificationType,
                        Message = "Bao cao story da duoc duyet. Story vi pham da bi xoa. / Your story report was approved and the reported story was removed."
                    },
                    cancellationToken);

                if (storyOwnerUserId.HasValue && storyOwnerUserId.Value != report.ReportedByUserId)
                {
                    await _notificationService.CreateAsync(
                        new CreateNotificationRequestDto
                        {
                            UserId = storyOwnerUserId.Value,
                            ActorUserId = adminUserId,
                            Type = StoryReportTargetNotificationType,
                            Message = "Story cua ban da bi xoa vi vi pham sau khi admin duyet bao cao. / Your story was removed by admin after report approval."
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
                    Type = StoryReportRejectedNotificationType,
                    Message = "Bao cao story bi tu choi sau khi xem xet. / Your story report was rejected after review."
                },
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not create story report resolve notifications. ReportId={ReportId}, Status={Status}.",
                report.Id,
                status);
        }
    }

    private static void EnsureStoryIsReportable(Story story)
    {
        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new NotFoundException("Story not found.");
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

using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.StoryReports;
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

public class StoryReportService : IStoryReportService
{
    private readonly IStoryReportRepository _storyReportRepository;
    private readonly IStoryRepository _storyRepository;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<StoryReportService> _logger;

    public StoryReportService(
        IStoryReportRepository storyReportRepository,
        IStoryRepository storyRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<StoryReportService> logger)
    {
        _storyReportRepository = storyReportRepository;
        _storyRepository = storyRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
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
            ?? throw new BusinessException(ErrorCode.STORY_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to access this story report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<StoryReportResponseDto> CreateAsync(
        Guid userId,
        CreateStoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdAsync(request.StoryId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_NOT_FOUND);

        if (story.IsDeleted || story.ExpiredAt <= DateTime.UtcNow)
        {
            throw new BusinessException(ErrorCode.STORY_NOT_FOUND);
        }

        if (story.UserId == userId)
        {
            throw new BusinessException(ErrorCode.CANNOT_REPORT_OWN_STORY);
        }

        var hasPendingReport = await _storyReportRepository.ExistsByStoryAndReporterAsync(story.Id, userId, cancellationToken);
        if (hasPendingReport)
        {
            throw new BusinessException(ErrorCode.DUPLICATE_STORY_REPORT);
        }

        var now = DateTime.UtcNow;
        var report = new StoryReport
        {
            Id = Guid.NewGuid(),
            StoryId = story.Id,
            ReportedByUserId = userId,
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
        var report = await _storyReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_REPORT_NOT_FOUND);

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || (normalizedStatus is not ReportStatus.RESOLVED and not ReportStatus.REJECTED))
        {
            throw new BusinessException(ErrorCode.INVALID_REPORT_STATUS);
        }

        var ownerMap = await _storyRepository.GetOwnerUserIdsByStoryIdsAsync([report.StoryId], cancellationToken);
        var storyOwnerUserId = ownerMap[report.StoryId];
        var auditTargetUserId = storyOwnerUserId;
        var previousStatus = report.Status;

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var story = await _storyRepository.GetByIdForUpdateAsync(report.StoryId, cancellationToken);
            if (story is not null && !story.IsDeleted)
            {
                story.IsDeleted = true;
                storyOwnerUserId = story.UserId;
                auditTargetUserId = story.UserId;
            }
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUserId;
        report.UpdatedAt = DateTime.UtcNow;

        await CreateResolveNotificationsAsync(report, adminUserId, normalizedStatus, storyOwnerUserId, cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            normalizedStatus == ReportStatus.RESOLVED
                ? AdminAuditActionType.STORY_REPORT_APPROVED
                : AdminAuditActionType.STORY_REPORT_REJECTED,
            AdminAuditEntityType.STORY_REPORT,
            report.Id,
            auditTargetUserId,
            $"StoryReportId={report.Id};StoryId={report.StoryId};Previous={previousStatus};Current={normalizedStatus}.",
            cancellationToken);
    

        var mappedItems = await MapReportsAsync([report], cancellationToken); 
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _storyReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.STORY_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to delete this story report.");
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

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);

        return StoryReportMapper.ToResponseDtos(
            reports,
            ownerMap,
            profileLookup,
            fallbackDisplayName: "user");
    }

    private async Task CreateResolveNotificationsAsync(
        StoryReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid storyOwnerUserId,
        CancellationToken cancellationToken)
    {
        if (status == ReportStatus.RESOLVED)
        {
            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                    {
                        UserId = report.ReportedByUserId,
                        ActorUserId = adminUserId,
                        StoryId = report.StoryId,
                        Type = NotificationType.STORY_REPORT_APPROVED.ToString(),
                        Message = ReportNotificationMessageConstants.Story.ReporterApproved
                    },
                    cancellationToken);

            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = storyOwnerUserId,
                    ActorUserId = adminUserId,
                    StoryId = report.StoryId,
                    Type = NotificationType.STORY_REPORT_TARGET_ACTION.ToString(),
                    Message = ReportNotificationMessageConstants.Story.TargetRemoved
                },
                cancellationToken);

            return;
        }

        await _notificationService.CreateAsync(
            new CreateNotificationRequestDto
            {
                UserId = report.ReportedByUserId,
                ActorUserId = adminUserId,
                StoryId = report.StoryId,
                Type = NotificationType.STORY_REPORT_REJECTED.ToString(),
                Message = ReportNotificationMessageConstants.Story.ReporterRejected
            },
            cancellationToken);
    }

}

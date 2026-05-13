using InteractHub.Api.Application.DTOs.PostReports;
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

public class PostReportService : IPostReportService
{
    private readonly IPostReportRepository _postReportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostReportService> _logger;

    public PostReportService(
        IPostReportRepository postReportRepository,
        IPostRepository postRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<PostReportService> logger)
    {
        _postReportRepository = postReportRepository;
        _postRepository = postRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _notificationService = notificationService;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<PostReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<PostReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postReportRepository.GetPagedByReporterAsync(userId, query.Page, query.PageSize, cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<PostReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public Task<int> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        return _postReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
    }

    public async Task<PostReportResponseDto> GetByIdAsync(
        Guid reportId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var report = await _postReportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to access this post report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<PostReportResponseDto> CreateAsync(Guid userId, CreatePostReportRequestDto request, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var hasPendingReport = await _postReportRepository.ExistsByPostAndReporterAsync(post.Id, userId, cancellationToken);
        if (hasPendingReport)
        {
            throw new BusinessException(ErrorCode.DUPLICATE_POST_REPORT);
        }

        var now = DateTime.UtcNow;

        var report = new PostReport
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            ReportedByUserId = userId,
            Reason = request.Reason.Trim(),
            Status = ReportStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _postReportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<PostReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolvePostReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var report = await _postReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_REPORT_NOT_FOUND);

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || (normalizedStatus is not ReportStatus.RESOLVED and not ReportStatus.REJECTED))
        {
            throw new BusinessException(ErrorCode.INVALID_REPORT_STATUS);
        }

        var ownerMap = await _postRepository.GetOwnerUserIdsByPostIdsAsync([report.PostId], cancellationToken);
        var postOwnerUserId = ownerMap[report.PostId];
        var targetUserId = postOwnerUserId;
        var previousStatus = report.Status;

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var post = await _postRepository.GetByIdForUpdateAsync(report.PostId, cancellationToken);
            if (post is not null && post.DeletedAt is null)
            {
                post.DeletedAt = DateTime.UtcNow;
                post.UpdatedAt = DateTime.UtcNow;
                postOwnerUserId = post.UserId;
                targetUserId = post.UserId;
            }
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUserId;
        report.UpdatedAt = DateTime.UtcNow;

        await CreateResolveNotificationsAsync(
            report,
            adminUserId,
            normalizedStatus,
            postOwnerUserId,
            cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            normalizedStatus == ReportStatus.RESOLVED
                ? AdminAuditActionType.POST_REPORT_APPROVED
                : AdminAuditActionType.POST_REPORT_REJECTED,
            AdminAuditEntityType.POST_REPORT,
            report.Id,
            targetUserId,
            $"PostReportId={report.Id};PostId={report.PostId};Previous={previousStatus};Current={normalizedStatus}.",
            cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _postReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.POST_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to delete this post report.");
        }

        _postReportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<PostReportResponseDto>> MapReportsAsync(
        IReadOnlyList<PostReport> reports,
        CancellationToken cancellationToken)
    {
        if (reports.Count == 0)
        {
            return [];
        }

        var ownerMap = await _postRepository.GetOwnerUserIdsByPostIdsAsync(
            reports.Select(report => report.PostId).Distinct().ToList(),
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

        return PostReportMapper.ToResponseDtos(
            reports,
            ownerMap,
            profileLookup,
            fallbackDisplayName: "user");
    }

    private async Task CreateResolveNotificationsAsync(
        PostReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid postOwnerUserId,
        CancellationToken cancellationToken)
    {
        if (status == ReportStatus.RESOLVED)
        {
            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = report.ReportedByUserId,
                    ActorUserId = adminUserId,
                    PostId = report.PostId,
                    Type = NotificationType.POST_REPORT_APPROVED.ToString(),
                    Message = ReportNotificationMessageConstants.Post.ReporterApproved
                },
                cancellationToken);

            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = postOwnerUserId,
                    ActorUserId = adminUserId,
                    PostId = report.PostId,
                    Type = NotificationType.POST_REPORT_TARGET_ACTION.ToString(),
                    Message = ReportNotificationMessageConstants.Post.TargetRemoved
                },
                cancellationToken);

            return;
        }

        await _notificationService.CreateAsync(
            new CreateNotificationRequestDto
            {
                UserId = report.ReportedByUserId,
                ActorUserId = adminUserId,
                PostId = report.PostId,
                Type = NotificationType.POST_REPORT_REJECTED.ToString(),
                Message = ReportNotificationMessageConstants.Post.ReporterRejected
            },
            cancellationToken);
    }

}







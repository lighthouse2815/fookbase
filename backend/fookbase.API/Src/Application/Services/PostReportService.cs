using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Notifications;
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

public class PostReportService : IPostReportService
{
    private static readonly HashSet<ReportStatus> AllowedResolveStatuses =
    [
        ReportStatus.RESOLVED,
        ReportStatus.REJECTED
    ];

    private readonly IPostReportRepository _postReportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostReportService> _logger;

    private const string PostReportApprovedNotificationType = "POST_REPORT_APPROVED";
    private const string PostReportRejectedNotificationType = "POST_REPORT_REJECTED";
    private const string PostReportTargetNotificationType = "POST_REPORT_TARGET_ACTION";

    public PostReportService(
        IPostReportRepository postReportRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IUserReadModelService userReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<PostReportService> logger)
    {
        _postReportRepository = postReportRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _userReadModelService = userReadModelService;
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
            ?? throw new NotFoundException("Post report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to access this post report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<PostReportResponseDto> CreateAsync(Guid userId, CreatePostReportRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var hasPendingReport = await _postReportRepository.ExistsByPostAndReporterAsync(post.Id, user.Id, cancellationToken);
        if (hasPendingReport)
        {
            throw new ArgumentException("You already have a pending report for this post.");
        }

        var now = DateTime.UtcNow;

        var report = new PostReport
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            ReportedByUserId = user.Id,
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
        var adminUser = await _javaApiService.GetUserById(adminUserId, cancellationToken)
            ?? throw new NotFoundException("Admin user not found.");

        var report = await _postReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Post report not found.");

        var previousStatus = report.Status;
        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || !AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be RESOLVED or REJECTED.");
        }

        var ownerMap = await _postRepository.GetOwnerUserIdsByPostIdsAsync([report.PostId], cancellationToken);
        var postOwnerUserId = ownerMap.TryGetValue(report.PostId, out var ownerId)
            ? ownerId
            : (Guid?)null;
        var targetUserId = postOwnerUserId;

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
        report.ResolvedByUserId = adminUser.Id;
        report.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await TryCreateResolveNotificationsAsync(
            report,
            adminUserId,
            normalizedStatus,
            targetUserId,
            cancellationToken);

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                normalizedStatus == ReportStatus.RESOLVED ? "POST_REPORT_APPROVED" : "POST_REPORT_REJECTED",
                "POST_REPORT",
                report.Id,
                targetUserId,
                $"PostReportId={report.Id};PostId={report.PostId};Previous={previousStatus};Current={normalizedStatus}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist audit log for post report resolution. ReportId={ReportId}", report.Id);
        }

        _logger.LogInformation(
            "Admin moderation action. AdminUserId={AdminUserId}, ReportId={ReportId}, PostId={PostId}, ReporterUserId={ReporterUserId}, PostOwnerUserId={PostOwnerUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}, ResolvedAt={ResolvedAt}.",
            adminUser.Id,
            report.Id,
            report.PostId,
            report.ReportedByUserId,
            postOwnerUserId,
            previousStatus,
            report.Status,
            report.ResolvedAt);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _postReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Post report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to delete this post report.");
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

        var summaries = await _userReadModelService.ResolveAuthorsAsync(
            userIds,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");

        return reports
            .Select(report =>
            {
                var ownerUserId = ownerMap.TryGetValue(report.PostId, out var ownerId) ? ownerId : (Guid?)null;
                return report.ToResponseDto(
                    postOwnerUserId: ownerUserId,
                    reporter: ResolveSummaryOrFallback(report.ReportedByUserId, summaries),
                    postOwner: ownerUserId.HasValue ? ResolveSummaryOrFallback(ownerUserId.Value, summaries) : null);
            })
            .ToList();
    }

    private async Task TryCreateResolveNotificationsAsync(
        PostReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid? targetUserId,
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
                        PostId = report.PostId,
                        Type = PostReportApprovedNotificationType,
                        Message = "Bao cao bai viet da duoc duyet. Bai viet vi pham da bi xoa. / Your post report was approved and the reported post was removed."
                    },
                    cancellationToken);

                if (targetUserId.HasValue && targetUserId.Value != report.ReportedByUserId)
                {
                    await _notificationService.CreateAsync(
                        new CreateNotificationRequestDto
                        {
                            UserId = targetUserId.Value,
                            ActorUserId = adminUserId,
                            PostId = report.PostId,
                            Type = PostReportTargetNotificationType,
                            Message = "Bai viet cua ban da bi xoa do vi pham sau khi admin duyet bao cao. / Your post was removed by admin after report approval."
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
                    PostId = report.PostId,
                    Type = PostReportRejectedNotificationType,
                    Message = "Bao cao bai viet da bi tu choi sau khi xem xet. / Your post report was rejected after review."
                },
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not create post report resolve notifications. ReportId={ReportId}, Status={Status}.",
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

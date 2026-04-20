using InteractHub.Api.Application.DTOs.CommentReports;
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

public class CommentReportService : ICommentReportService
{
    private static readonly HashSet<ReportStatus> AllowedResolveStatuses =
    [
        ReportStatus.RESOLVED,
        ReportStatus.REJECTED
    ];

    private const string CommentReportApprovedNotificationType = "COMMENT_REPORT_APPROVED";
    private const string CommentReportRejectedNotificationType = "COMMENT_REPORT_REJECTED";
    private const string CommentReportTargetNotificationType = "COMMENT_REPORT_TARGET_ACTION";

    private readonly ICommentReportRepository _commentReportRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentReportService> _logger;

    public CommentReportService(
        ICommentReportRepository commentReportRepository,
        ICommentRepository commentRepository,
        IJavaApiService javaApiService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<CommentReportService> logger)
    {
        _commentReportRepository = commentReportRepository;
        _commentRepository = commentRepository;
        _javaApiService = javaApiService;
        _notificationService = notificationService;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<CommentReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _commentReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        var mappedItems = await MapReportsAsync(items, cancellationToken);

        return PagedResult<CommentReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PagedResult<CommentReportResponseDto>> GetMineAsync(
        Guid userId,
        PaginationQuery query,
        CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _commentReportRepository.GetPagedByReporterAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken);

        var mappedItems = await MapReportsAsync(items, cancellationToken);
        return PagedResult<CommentReportResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public Task<int> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        return _commentReportRepository.CountByStatusAsync(ReportStatus.PENDING, cancellationToken);
    }

    public async Task<CommentReportResponseDto> GetByIdAsync(
        Guid reportId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        var report = await _commentReportRepository.GetByIdAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Comment report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to access this comment report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<CommentReportResponseDto> CreateAsync(
        Guid userId,
        CreateCommentReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var comment = await _commentRepository.GetByIdAsync(request.CommentId, cancellationToken)
            ?? throw new NotFoundException("Comment not found.");

        var hasPendingReport = await _commentReportRepository.ExistsByCommentAndReporterAsync(comment.Id, user.Id, cancellationToken);
        if (hasPendingReport)
        {
            throw new ArgumentException("You already have a pending report for this comment.");
        }

        var now = DateTime.UtcNow;
        var report = new CommentReport
        {
            Id = Guid.NewGuid(),
            CommentId = comment.Id,
            PostId = comment.PostId,
            ReportedByUserId = user.Id,
            Reason = request.Reason.Trim(),
            Status = ReportStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _commentReportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<CommentReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveCommentReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUser = await _javaApiService.GetUserById(adminUserId, cancellationToken)
            ?? throw new NotFoundException("Admin user not found.");

        var report = await _commentReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Comment report not found.");

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || !AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be RESOLVED or REJECTED.");
        }

        var ownerMap = await _commentRepository.GetOwnerUserIdsByCommentIdsAsync([report.CommentId], cancellationToken);
        var commentOwnerUserId = ownerMap.TryGetValue(report.CommentId, out var ownerId)
            ? ownerId
            : (Guid?)null;
        var previousStatus = report.Status;

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var comment = await _commentRepository.GetByIdAsync(report.CommentId, cancellationToken);
            if (comment is not null && comment.DeletedAt is null)
            {
                comment.DeletedAt = DateTime.UtcNow;
                comment.UpdatedAt = DateTime.UtcNow;
                commentOwnerUserId = comment.UserId;
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
            commentOwnerUserId,
            cancellationToken);

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                normalizedStatus == ReportStatus.RESOLVED ? "COMMENT_REPORT_APPROVED" : "COMMENT_REPORT_REJECTED",
                "COMMENT_REPORT",
                report.Id,
                commentOwnerUserId,
                $"CommentReportId={report.Id};CommentId={report.CommentId};PostId={report.PostId};Previous={previousStatus};Current={normalizedStatus}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist audit log for comment report resolution. ReportId={ReportId}", report.Id);
        }

        _logger.LogInformation(
            "Admin moderation action on comment report. AdminUserId={AdminUserId}, ReportId={ReportId}, CommentId={CommentId}, PostId={PostId}, ReporterUserId={ReporterUserId}, CommentOwnerUserId={CommentOwnerUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}.",
            adminUser.Id,
            report.Id,
            report.CommentId,
            report.PostId,
            report.ReportedByUserId,
            commentOwnerUserId,
            previousStatus,
            report.Status);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _commentReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new NotFoundException("Comment report not found.");

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new ForbiddenException("You are not allowed to delete this comment report.");
        }

        _commentReportRepository.Remove(report);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<CommentReportResponseDto>> MapReportsAsync(
        IReadOnlyList<CommentReport> reports,
        CancellationToken cancellationToken)
    {
        if (reports.Count == 0)
        {
            return [];
        }

        var ownerMap = await _commentRepository.GetOwnerUserIdsByCommentIdsAsync(
            reports.Select(report => report.CommentId).Distinct().ToList(),
            cancellationToken);

        var userIds = reports
            .Select(report => report.ReportedByUserId)
            .Concat(ownerMap.Values)
            .Distinct()
            .ToList();

        var summaries = await ResolveUserSummariesAsync(userIds, cancellationToken);

        return reports
            .Select(report =>
            {
                var commentOwnerUserId = ownerMap.TryGetValue(report.CommentId, out var ownerId) ? ownerId : (Guid?)null;
                return report.ToResponseDto(
                    commentOwnerUserId: commentOwnerUserId,
                    reporter: ResolveSummaryOrFallback(report.ReportedByUserId, summaries),
                    commentOwner: commentOwnerUserId.HasValue
                        ? ResolveSummaryOrFallback(commentOwnerUserId.Value, summaries)
                        : null);
            })
            .ToList();
    }

    private async Task<Dictionary<Guid, AuthorSummaryDto>> ResolveUserSummariesAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, AuthorSummaryDto>();
        }

        var tasks = distinctUserIds.Select(async userId =>
        {
            try
            {
                var profile = await _javaApiService.GetProfileSummaryByUserId(userId, cancellationToken: cancellationToken);
                var summary = profile is null
                    ? BuildFallbackSummary(userId)
                    : new AuthorSummaryDto
                    {
                        Id = userId,
                        DisplayName = string.IsNullOrWhiteSpace(profile.DisplayName)
                            ? "user"
                            : profile.DisplayName.Trim(),
                        AvatarUrl = string.IsNullOrWhiteSpace(profile.AvatarUrl)
                            ? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
                            : profile.AvatarUrl.Trim()
                    };

                return new KeyValuePair<Guid, AuthorSummaryDto>(userId, summary);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                _logger.LogWarning(exception, "Could not load user summary for comment report user {UserId}.", userId);
                return new KeyValuePair<Guid, AuthorSummaryDto>(userId, BuildFallbackSummary(userId));
            }
        });

        var pairs = await Task.WhenAll(tasks);
        return pairs.ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    private async Task TryCreateResolveNotificationsAsync(
        CommentReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid? commentOwnerUserId,
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
                        CommentId = report.CommentId,
                        Type = CommentReportApprovedNotificationType,
                        Message = "Bao cao binh luan da duoc duyet. Binh luan vi pham da bi xoa. / Your comment report was approved and the reported comment was removed."
                    },
                    cancellationToken);

                if (commentOwnerUserId.HasValue && commentOwnerUserId.Value != report.ReportedByUserId)
                {
                    await _notificationService.CreateAsync(
                        new CreateNotificationRequestDto
                        {
                            UserId = commentOwnerUserId.Value,
                            ActorUserId = adminUserId,
                            PostId = report.PostId,
                            CommentId = report.CommentId,
                            Type = CommentReportTargetNotificationType,
                            Message = "Binh luan cua ban da bi xoa do vi pham sau khi admin duyet bao cao. / Your comment was removed by admin after report approval."
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
                    CommentId = report.CommentId,
                    Type = CommentReportRejectedNotificationType,
                    Message = "Bao cao binh luan da bi tu choi sau khi xem xet. / Your comment report was rejected after review."
                },
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not create comment report resolve notifications. ReportId={ReportId}, Status={Status}.",
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

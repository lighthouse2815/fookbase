using InteractHub.Api.Application.DTOs.CommentReports;
using InteractHub.Api.Application.DTOs.Common;
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

public class CommentReportService : ICommentReportService
{
    private readonly ICommentReportRepository _commentReportRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly INotificationService _notificationService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CommentReportService> _logger;

    public CommentReportService(
        ICommentReportRepository commentReportRepository,
        ICommentRepository commentRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        INotificationService notificationService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<CommentReportService> logger)
    {
        _commentReportRepository = commentReportRepository;
        _commentRepository = commentRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
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
            ?? throw new BusinessException(ErrorCode.COMMENT_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to access this comment report.");
        }

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task<CommentReportResponseDto> CreateAsync(
        Guid userId,
        CreateCommentReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(request.CommentId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);

        var hasPendingReport = await _commentReportRepository.ExistsByCommentAndReporterAsync(comment.Id, userId, cancellationToken);
        if (hasPendingReport)
        {
            throw new BusinessException(ErrorCode.DUPLICATE_COMMENT_REPORT);
        }

        var now = DateTime.UtcNow;
        var report = new CommentReport
        {
            Id = Guid.NewGuid(),
            CommentId = comment.Id,
            PostId = comment.PostId,
            ReportedByUserId = userId,
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
        var report = await _commentReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_REPORT_NOT_FOUND);

        if (!EnumParser.TryParseReportStatus(request.Status, out var normalizedStatus)
            || (normalizedStatus is not ReportStatus.RESOLVED and not ReportStatus.REJECTED))
        {
            throw new BusinessException(ErrorCode.INVALID_REPORT_STATUS);
        }

        var ownerMap = await _commentRepository.GetOwnerUserIdsByCommentIdsAsync([report.CommentId], cancellationToken);
        var commentOwnerUserId = ownerMap[report.CommentId];
        var auditTargetUserId = commentOwnerUserId;
        var previousStatus = report.Status;

        if (normalizedStatus == ReportStatus.RESOLVED)
        {
            var comment = await _commentRepository.GetByIdAsync(report.CommentId, cancellationToken);
            if (comment is not null && comment.DeletedAt is null)
            {
                comment.DeletedAt = DateTime.UtcNow;
                comment.UpdatedAt = DateTime.UtcNow;
                commentOwnerUserId = comment.UserId;
                auditTargetUserId = comment.UserId;
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
            commentOwnerUserId,
            cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            normalizedStatus == ReportStatus.RESOLVED
                ? AdminAuditActionType.COMMENT_REPORT_APPROVED
                : AdminAuditActionType.COMMENT_REPORT_REJECTED,
            AdminAuditEntityType.COMMENT_REPORT,
            report.Id,
            auditTargetUserId,
            $"CommentReportId={report.Id};CommentId={report.CommentId};PostId={report.PostId};Previous={previousStatus};Current={normalizedStatus}.",
            cancellationToken);

        var mappedItems = await MapReportsAsync([report], cancellationToken);
        return mappedItems[0];
    }

    public async Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var report = await _commentReportRepository.GetByIdForUpdateAsync(reportId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.COMMENT_REPORT_NOT_FOUND);

        if (!isAdmin && report.ReportedByUserId != userId)
        {
            throw new BusinessException(ErrorCode.FORBIDDEN, "You are not allowed to delete this comment report.");
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

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            userIds,
            cancellationToken,
            requireFresh: false);

        return CommentReportMapper.ToResponseDtos(
            reports,
            ownerMap,
            profileLookup,
            fallbackDisplayName: "user");
    }

    private async Task CreateResolveNotificationsAsync(
        CommentReport report,
        Guid adminUserId,
        ReportStatus status,
        Guid commentOwnerUserId,
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
                    CommentId = report.CommentId,
                    Type = NotificationType.COMMENT_REPORT_APPROVED.ToString(),
                    Message = ReportNotificationMessageConstants.Comment.ReporterApproved
                },
                cancellationToken);

            
            await _notificationService.CreateAsync(
                new CreateNotificationRequestDto
                {
                    UserId = commentOwnerUserId,
                    ActorUserId = adminUserId,
                    PostId = report.PostId,
                    CommentId = report.CommentId,
                    Type = NotificationType.COMMENT_REPORT_TARGET_ACTION.ToString(),
                    Message = ReportNotificationMessageConstants.Comment.TargetRemoved
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
                CommentId = report.CommentId,
                Type = NotificationType.COMMENT_REPORT_REJECTED.ToString(),
                Message = ReportNotificationMessageConstants.Comment.ReporterRejected
            },
            cancellationToken);  
    }

}







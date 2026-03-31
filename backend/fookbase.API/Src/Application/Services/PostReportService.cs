using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class PostReportService : IPostReportService
{
    private static readonly HashSet<string> AllowedResolveStatuses = new(StringComparer.Ordinal)
    {
        ReportStatuses.Resolved,
        ReportStatuses.Rejected
    };

    private readonly IPostReportRepository _postReportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostReportService> _logger;

    public PostReportService(
        IPostReportRepository postReportRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IUnitOfWork unitOfWork,
        ILogger<PostReportService> logger)
    {
        _postReportRepository = postReportRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postReportRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);

        return PagedResult<PostReportResponseDto>.Create(
            items.Select(static report => report.ToResponseDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<PagedResult<PostReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postReportRepository.GetPagedByReporterAsync(userId, query.Page, query.PageSize, cancellationToken);

        return PagedResult<PostReportResponseDto>.Create(
            items.Select(static report => report.ToResponseDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public Task<int> GetPendingCountAsync(CancellationToken cancellationToken)
    {
        return _postReportRepository.CountByStatusAsync(ReportStatuses.Pending, cancellationToken);
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

        return report.ToResponseDto();
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
            Status = ReportStatuses.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _postReportRepository.AddAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return report.ToResponseDto();
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
        var normalizedStatus = request.Status.Trim().ToUpperInvariant();
        if (!AllowedResolveStatuses.Contains(normalizedStatus))
        {
            throw new ArgumentException("Status must be RESOLVED or REJECTED.");
        }

        report.Status = normalizedStatus;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = adminUser.Id;
        report.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Admin moderation action. AdminUserId={AdminUserId}, ReportId={ReportId}, PostId={PostId}, ReporterUserId={ReporterUserId}, PreviousStatus={PreviousStatus}, NewStatus={NewStatus}, ResolvedAt={ResolvedAt}.",
            adminUser.Id,
            report.Id,
            report.PostId,
            report.ReportedByUserId,
            previousStatus,
            report.Status,
            report.ResolvedAt);

        return report.ToResponseDto();
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

}

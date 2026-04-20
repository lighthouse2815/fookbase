using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class CommentReportRepository : ICommentReportRepository
{
    private readonly AppDbContext _context;

    public CommentReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.CommentReports
            .AsNoTracking()
            .OrderByDescending(report => report.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.CommentReports
            .AsNoTracking()
            .Where(report => report.ReportedByUserId == reporterUserId)
            .OrderByDescending(report => report.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<CommentReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.CommentReports
            .AsNoTracking()
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<CommentReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.CommentReports
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<bool> ExistsByCommentAndReporterAsync(Guid commentId, Guid reporterUserId, CancellationToken cancellationToken)
    {
        return _context.CommentReports.AnyAsync(
            report => report.CommentId == commentId
                && report.ReportedByUserId == reporterUserId
                && report.Status == ReportStatus.PENDING,
            cancellationToken);
    }

    public Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken)
    {
        return _context.CommentReports.CountAsync(report => report.Status == status, cancellationToken);
    }

    public Task AddAsync(CommentReport commentReport, CancellationToken cancellationToken)
    {
        return _context.CommentReports.AddAsync(commentReport, cancellationToken).AsTask();
    }

    public void Remove(CommentReport commentReport)
    {
        _context.CommentReports.Remove(commentReport);
    }
}

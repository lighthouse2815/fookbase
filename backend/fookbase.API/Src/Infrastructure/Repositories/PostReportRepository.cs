using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class PostReportRepository : IPostReportRepository
{
    private readonly AppDbContext _context;

    public PostReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.PostReports
            .AsNoTracking()
            .OrderByDescending(report => report.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.PostReports
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

    public Task<PostReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.PostReports
            .AsNoTracking()
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<PostReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.PostReports
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<bool> ExistsByPostAndReporterAsync(Guid postId, Guid reporterUserId, CancellationToken cancellationToken)
    {
        return _context.PostReports.AnyAsync(
            report => report.PostId == postId && report.ReportedByUserId == reporterUserId && report.Status == "PENDING",
            cancellationToken);
    }

    public Task AddAsync(PostReport postReport, CancellationToken cancellationToken)
    {
        return _context.PostReports.AddAsync(postReport, cancellationToken).AsTask();
    }

    public void Remove(PostReport postReport)
    {
        _context.PostReports.Remove(postReport);
    }
}
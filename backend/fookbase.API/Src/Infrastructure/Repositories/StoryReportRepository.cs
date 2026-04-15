using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class StoryReportRepository : IStoryReportRepository
{
    private readonly AppDbContext _context;

    public StoryReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<StoryReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.StoryReports
            .AsNoTracking()
            .OrderByDescending(report => report.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<StoryReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.StoryReports
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

    public Task<StoryReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.StoryReports
            .AsNoTracking()
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<StoryReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.StoryReports
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<bool> ExistsByStoryAndReporterAsync(Guid storyId, Guid reporterUserId, CancellationToken cancellationToken)
    {
        return _context.StoryReports.AnyAsync(
            report => report.StoryId == storyId
                && report.ReportedByUserId == reporterUserId
                && report.Status == ReportStatus.PENDING,
            cancellationToken);
    }

    public Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken)
    {
        return _context.StoryReports.CountAsync(report => report.Status == status, cancellationToken);
    }

    public Task AddAsync(StoryReport storyReport, CancellationToken cancellationToken)
    {
        return _context.StoryReports.AddAsync(storyReport, cancellationToken).AsTask();
    }

    public void Remove(StoryReport storyReport)
    {
        _context.StoryReports.Remove(storyReport);
    }
}


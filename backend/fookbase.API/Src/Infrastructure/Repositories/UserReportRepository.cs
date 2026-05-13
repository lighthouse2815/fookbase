using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class UserReportRepository : IUserReportRepository
{
    private readonly AppDbContext _context;

    public UserReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.UserReports
            .AsNoTracking()
            .OrderByDescending(report => report.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var query = _context.UserReports
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

    public Task<UserReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.UserReports
            .AsNoTracking()
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<UserReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        return _context.UserReports
            .FirstOrDefaultAsync(report => report.Id == reportId, cancellationToken);
    }

    public Task<bool> ExistsByTargetAndReporterAsync(Guid targetUserId, Guid reporterUserId, CancellationToken cancellationToken)
    {
        return _context.UserReports.AnyAsync(
            report => report.TargetUserId == targetUserId
                && report.ReportedByUserId == reporterUserId
                && report.Status == ReportStatus.PENDING,
            cancellationToken);
    }

    public Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken)
    {
        return _context.UserReports.CountAsync(report => report.Status == status, cancellationToken);
    }

    public Task AddAsync(UserReport userReport, CancellationToken cancellationToken)
    {
        return _context.UserReports.AddAsync(userReport, cancellationToken).AsTask();
    }

    public void Remove(UserReport userReport)
    {
        _context.UserReports.Remove(userReport);
    }
}




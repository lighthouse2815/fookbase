using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IUserReportRepository
{
    Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedByReporterAsync(Guid reporterUserId, int page, int pageSize, CancellationToken cancellationToken);

    Task<UserReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken);

    Task<UserReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken);

    Task<bool> ExistsByTargetAndReporterAsync(Guid targetUserId, Guid reporterUserId, CancellationToken cancellationToken);

    Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken);

    Task AddAsync(UserReport userReport, CancellationToken cancellationToken);

    void Remove(UserReport userReport);
}




using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IPostReportRepository
{
    Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedByReporterAsync(Guid reporterUserId, int page, int pageSize, CancellationToken cancellationToken);

    Task<PostReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken);

    Task<PostReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken);

    Task<bool> ExistsByPostAndReporterAsync(Guid postId, Guid reporterUserId, CancellationToken cancellationToken);

    Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken);

    Task AddAsync(PostReport postReport, CancellationToken cancellationToken);

    void Remove(PostReport postReport);
}




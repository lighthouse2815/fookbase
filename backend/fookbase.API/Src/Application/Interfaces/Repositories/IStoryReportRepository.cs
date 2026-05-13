using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface IStoryReportRepository
{
    Task<(IReadOnlyList<StoryReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<StoryReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<StoryReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken);

    Task<StoryReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken);

    Task<bool> ExistsByStoryAndReporterAsync(Guid storyId, Guid reporterUserId, CancellationToken cancellationToken);

    Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken);

    Task AddAsync(StoryReport storyReport, CancellationToken cancellationToken);

    void Remove(StoryReport storyReport);
}





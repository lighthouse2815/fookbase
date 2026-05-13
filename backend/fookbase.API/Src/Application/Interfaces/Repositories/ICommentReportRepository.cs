using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Interfaces.Repositories;

public interface ICommentReportRepository
{
    Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedByReporterAsync(
        Guid reporterUserId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<CommentReport?> GetByIdAsync(Guid reportId, CancellationToken cancellationToken);

    Task<CommentReport?> GetByIdForUpdateAsync(Guid reportId, CancellationToken cancellationToken);

    Task<bool> ExistsByCommentAndReporterAsync(Guid commentId, Guid reporterUserId, CancellationToken cancellationToken);

    Task<int> CountByStatusAsync(ReportStatus status, CancellationToken cancellationToken);

    Task AddAsync(CommentReport commentReport, CancellationToken cancellationToken);

    void Remove(CommentReport commentReport);
}




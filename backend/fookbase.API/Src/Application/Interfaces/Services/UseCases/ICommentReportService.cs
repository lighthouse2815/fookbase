using InteractHub.Api.Application.DTOs.CommentReports;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ICommentReportService
{
    Task<PagedResult<CommentReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<CommentReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<int> GetPendingCountAsync(CancellationToken cancellationToken);

    Task<CommentReportResponseDto> GetByIdAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);

    Task<CommentReportResponseDto> CreateAsync(Guid userId, CreateCommentReportRequestDto request, CancellationToken cancellationToken);

    Task<CommentReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveCommentReportRequestDto request,
        CancellationToken cancellationToken);

    Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}




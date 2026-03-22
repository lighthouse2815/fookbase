using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IPostReportService
{
    Task<PagedResult<PostReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<PostReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<PostReportResponseDto> GetByIdAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);

    Task<PostReportResponseDto> CreateAsync(Guid userId, CreatePostReportRequestDto request, CancellationToken cancellationToken);

    Task<PostReportResponseDto> ResolveAsync(Guid reportId, Guid adminUserId, ResolvePostReportRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}
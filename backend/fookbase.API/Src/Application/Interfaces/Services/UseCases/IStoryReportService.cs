using InteractHub.Api.Application.DTOs.StoryReports;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IStoryReportService
{
    Task<PagedResult<StoryReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<StoryReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<int> GetPendingCountAsync(CancellationToken cancellationToken);

    Task<StoryReportResponseDto> GetByIdAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);

    Task<StoryReportResponseDto> CreateAsync(Guid userId, CreateStoryReportRequestDto request, CancellationToken cancellationToken);

    Task<StoryReportResponseDto> ResolveAsync(
        Guid reportId,
        Guid adminUserId,
        ResolveStoryReportRequestDto request,
        CancellationToken cancellationToken);

    Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}


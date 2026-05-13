using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IUserReportService
{
    Task<PagedResult<UserReportResponseDto>> GetAllAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<UserReportResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<int> GetPendingCountAsync(CancellationToken cancellationToken);

    Task<UserReportResponseDto> GetByIdAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);

    Task<UserReportResponseDto> CreateAsync(Guid userId, CreateUserReportRequestDto request, CancellationToken cancellationToken);

    Task<UserReportResponseDto> ResolveAsync(Guid reportId, Guid adminUserId, ResolveUserReportRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid reportId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}




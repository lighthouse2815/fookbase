using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IHashtagService
{
    Task<PagedResult<HashtagResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<HashtagResponseDto>> SearchAsync(string keyword, PaginationQuery query, CancellationToken cancellationToken);

    Task<HashtagResponseDto> GetByIdAsync(Guid hashtagId, CancellationToken cancellationToken);

    Task<HashtagResponseDto> CreateAsync(CreateHashtagRequestDto request, CancellationToken cancellationToken);

    Task<HashtagResponseDto> UpdateAsync(Guid hashtagId, UpdateHashtagRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid hashtagId, CancellationToken cancellationToken);
}
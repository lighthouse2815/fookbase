using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IPostService
{
    Task<PagedResult<PostResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PostResponseDto> GetByIdAsync(Guid postId, CancellationToken cancellationToken);

    Task<PostResponseDto> CreateAsync(Guid userId, CreatePostRequestDto request, CancellationToken cancellationToken);

    Task<PostResponseDto> UpdateAsync(Guid postId, Guid userId, bool isAdmin, UpdatePostRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid postId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}
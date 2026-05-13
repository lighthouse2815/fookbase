using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IPostService
{
    Task<PagedResult<PostResponseDto>> GetPagedAsync(
        PaginationQuery query,
        Guid? currentUserId,
        CancellationToken cancellationToken);

    Task<PostResponseDto> GetByIdAsync(Guid postId, Guid? currentUserId, CancellationToken cancellationToken);

    Task<PostResponseDto> CreateAsync(
        Guid userId,
        CreatePostRequestDto request,
        CancellationToken cancellationToken);

    Task<PostResponseDto> ShareAsync(
        Guid postId,
        Guid userId,
        SharePostRequestDto? request,
        CancellationToken cancellationToken);

    Task<PostResponseDto> UpdateAsync(Guid postId, Guid userId, bool isAdmin, UpdatePostRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid postId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}




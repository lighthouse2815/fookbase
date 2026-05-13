using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface ISavedPostService
{
    Task<PagedResult<PostResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<SavedPostStateResponseDto> SaveAsync(Guid userId, SavePostRequestDto request, CancellationToken cancellationToken);

    Task<SavedPostStateResponseDto> RemoveAsync(Guid userId, Guid postId, CancellationToken cancellationToken);
}




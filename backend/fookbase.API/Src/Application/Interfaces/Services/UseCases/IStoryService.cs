using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IStoryService
{
    Task<PagedResult<StoryResponseDto>> GetFeedAsync(
        Guid currentUserId,
        PaginationQuery query,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<PagedResult<StoryResponseDto>> GetByUserIdAsync(
        Guid targetUserId,
        Guid currentUserId,
        PaginationQuery query,
        CancellationToken cancellationToken);

    Task<StoryResponseDto> GetByIdAsync(Guid storyId, Guid currentUserId, CancellationToken cancellationToken);

    Task<StoryResponseDto> CreateAsync(Guid userId, CreateStoryRequestDto request, CancellationToken cancellationToken);

    Task MarkAsViewedAsync(Guid storyId, Guid viewerUserId, CancellationToken cancellationToken);

    Task DeleteAsync(Guid storyId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}

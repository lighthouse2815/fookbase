using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IStoryService
{
    Task<PagedResult<StoryResponseDto>> GetActiveAsync(PaginationQuery query, CancellationToken cancellationToken);

    Task<PagedResult<StoryResponseDto>> GetByUserIdAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken);

    Task<StoryResponseDto> GetByIdAsync(Guid storyId, CancellationToken cancellationToken);

    Task<StoryResponseDto> CreateAsync(Guid userId, CreateStoryRequestDto request, CancellationToken cancellationToken);

    Task<StoryResponseDto> UpdateAsync(Guid storyId, Guid userId, bool isAdmin, UpdateStoryRequestDto request, CancellationToken cancellationToken);

    Task DeleteAsync(Guid storyId, Guid userId, bool isAdmin, CancellationToken cancellationToken);
}
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class StoryService : IStoryService
{
    private readonly IStoryRepository _storyRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUnitOfWork _unitOfWork;

    public StoryService(
        IStoryRepository storyRepository,
        IJavaApiService javaApiService,
        IUnitOfWork unitOfWork)
    {
        _storyRepository = storyRepository;
        _javaApiService = javaApiService;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<StoryResponseDto>> GetActiveAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _storyRepository.GetPagedActiveAsync(query.Page, query.PageSize, cancellationToken);
        var now = DateTime.UtcNow;

        return PagedResult<StoryResponseDto>.Create(
            items.Select(story => story.ToResponseDto(now)).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<PagedResult<StoryResponseDto>> GetByUserIdAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var (items, totalCount) = await _storyRepository.GetPagedByUserIdAsync(user.Id, query.Page, query.PageSize, cancellationToken);
        var now = DateTime.UtcNow;

        return PagedResult<StoryResponseDto>.Create(
            items.Select(story => story.ToResponseDto(now)).ToList(),
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<StoryResponseDto> GetByIdAsync(Guid storyId, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        return story.ToResponseDto(DateTime.UtcNow);
    }

    public async Task<StoryResponseDto> CreateAsync(Guid userId, CreateStoryRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        if (request.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ArgumentException("ExpiresAt must be in the future.");
        }

        var now = DateTime.UtcNow;

        var story = new Story
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            MediaUrl = request.MediaUrl,
            ExpiresAt = request.ExpiresAt,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _storyRepository.AddAsync(story, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return story.ToResponseDto(DateTime.UtcNow);
    }

    public async Task<StoryResponseDto> UpdateAsync(
        Guid storyId,
        Guid userId,
        bool isAdmin,
        UpdateStoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        EnsureOwnerOrAdmin(story.UserId, userId, isAdmin, "You are not allowed to update this story.");

        if (request.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ArgumentException("ExpiresAt must be in the future.");
        }

        story.MediaUrl = request.MediaUrl;
        story.ExpiresAt = request.ExpiresAt;
        story.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return story.ToResponseDto(DateTime.UtcNow);
    }

    public async Task DeleteAsync(Guid storyId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var story = await _storyRepository.GetByIdForUpdateAsync(storyId, cancellationToken)
            ?? throw new NotFoundException("Story not found.");

        EnsureOwnerOrAdmin(story.UserId, userId, isAdmin, "You are not allowed to delete this story.");

        story.DeletedAt = DateTime.UtcNow;
        story.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
    }

}

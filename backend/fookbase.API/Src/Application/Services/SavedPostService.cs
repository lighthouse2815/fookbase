using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class SavedPostService : ISavedPostService
{
    private readonly ISavedPostRepository _savedPostRepository;
    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SavedPostService> _logger;

    public SavedPostService(
        ISavedPostRepository savedPostRepository,
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IUnitOfWork unitOfWork,
        ILogger<SavedPostService> logger)
    {
        _savedPostRepository = savedPostRepository;
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _savedPostRepository.GetPagedByUserAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken);

        var posts = items
            .Select(savedPost => savedPost.Post)
            .ToList();

        var authors = await ResolveAuthorsAsync(posts.Select(post => post.UserId), cancellationToken);

        var mappedItems = posts
            .Select(post =>
            {
                var dto = post.ToResponseDto();
                return dto with
                {
                    Author = authors.TryGetValue(post.UserId, out var author)
                        ? author
                        : CreateFallbackAuthor(post.UserId),
                    LikedByCurrentUser = post.Likes.Any(like => like.UserId == userId)
                };
            })
            .ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<SavedPostStateResponseDto> SaveAsync(
        Guid userId,
        SavePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(request.PostId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var existing = await _savedPostRepository.GetByUserAndPostAsync(userId, post.Id, cancellationToken);
        if (existing is not null)
        {
            return new SavedPostStateResponseDto
            {
                PostId = post.Id,
                Saved = true,
                SavedAt = existing.CreatedAt
            };
        }

        var savedAt = DateTime.UtcNow;
        await _savedPostRepository.AddAsync(new SavedPost
        {
            Id = Guid.NewGuid(),
            PostId = post.Id,
            UserId = userId,
            CreatedAt = savedAt
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SavedPostStateResponseDto
        {
            PostId = post.Id,
            Saved = true,
            SavedAt = savedAt
        };
    }

    public async Task<SavedPostStateResponseDto> RemoveAsync(Guid userId, Guid postId, CancellationToken cancellationToken)
    {
        var existing = await _savedPostRepository.GetByUserAndPostForUpdateAsync(userId, postId, cancellationToken);
        if (existing is null)
        {
            return new SavedPostStateResponseDto
            {
                PostId = postId,
                Saved = false
            };
        }

        _savedPostRepository.Remove(existing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SavedPostStateResponseDto
        {
            PostId = postId,
            Saved = false
        };
    }

    private async Task<Dictionary<Guid, PostAuthorDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, PostAuthorDto>();
        }

        var tasks = distinctUserIds.Select(async userId =>
            new KeyValuePair<Guid, PostAuthorDto>(userId, await ResolveAuthorAsync(userId, cancellationToken)));

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(pair => pair.Key, pair => pair.Value);
    }

    private async Task<PostAuthorDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var userTask = _javaApiService.GetUserById(userId, cancellationToken: cancellationToken);
            var profileTask = _javaApiService.GetProfileByUserId(userId, cancellationToken: cancellationToken);

            await Task.WhenAll(userTask, profileTask);

            var user = userTask.Result;
            var profile = profileTask.Result;
            var username = Normalize(user?.Username) ?? "user";
            var displayName = Normalize(profile?.DisplayName)
                ?? Normalize(profile?.FullName)
                ?? username;

            return new PostAuthorDto
            {
                Id = userId,
                Username = username,
                DisplayName = displayName,
                AvatarUrl = Normalize(profile?.AvatarUrl) ?? BuildDefaultAvatarUrl(userId)
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Falling back to default post author for user {UserId} while loading saved posts.",
                userId);
            return CreateFallbackAuthor(userId);
        }
    }

    private static PostAuthorDto CreateFallbackAuthor(Guid userId)
    {
        return new PostAuthorDto
        {
            Id = userId,
            Username = "user",
            DisplayName = "user",
            AvatarUrl = BuildDefaultAvatarUrl(userId)
        };
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string BuildDefaultAvatarUrl(Guid userId)
    {
        return $"https://i.pravatar.cc/150?u={userId}";
    }
}

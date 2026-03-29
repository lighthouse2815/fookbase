using System.Text.RegularExpressions;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class PostService : IPostService
{
    private static readonly Regex HashtagRegex = new("#([A-Za-z0-9_]{1,50})", RegexOptions.Compiled);

    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IHashtagRepository _hashtagRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PostService> _logger;

    public PostService(
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IHashtagRepository hashtagRepository,
        IUnitOfWork unitOfWork,
        ILogger<PostService> logger)
    {
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _hashtagRepository = hashtagRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);
        var authors = await ResolveAuthorsAsync(items.Select(post => post.UserId), cancellationToken);

        var mappedItems = items
            .Select(post =>
            {
                var dto = post.ToResponseDto();
                dto = dto with
                {
                    Author = authors.TryGetValue(post.UserId, out var author)
                        ? author
                        : CreateFallbackAuthor(post.UserId)
                };

                return dto;
            })
            .ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var dto = post.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(post.UserId, cancellationToken) };
    }

    public async Task<PostResponseDto> CreateAsync(Guid userId, CreatePostRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");

        var now = DateTime.UtcNow;

        var post = new Post
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Content = request.Content.Trim(),
            ImageUrl = request.ImageUrl,
            CreatedAt = now,
            UpdatedAt = now
        };

        var hashtags = await GetOrCreateHashtagsAsync(post.Content, cancellationToken);
        foreach (var hashtag in hashtags)
        {
            post.PostHashtags.Add(new PostHashtag
            {
                PostId = post.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = now
            });
        }

        await _postRepository.AddAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = post.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(post.UserId, cancellationToken) };
    }

    public async Task<PostResponseDto> UpdateAsync(
        Guid postId,
        Guid userId,
        bool isAdmin,
        UpdatePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdForUpdateAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        EnsureOwnerOrAdmin(post.UserId, userId, isAdmin, "You are not allowed to update this post.");

        post.Content = request.Content.Trim();
        post.ImageUrl = request.ImageUrl;
        post.UpdatedAt = DateTime.UtcNow;

        var hashtags = await GetOrCreateHashtagsAsync(post.Content, cancellationToken);
        post.PostHashtags.Clear();

        foreach (var hashtag in hashtags)
        {
            post.PostHashtags.Add(new PostHashtag
            {
                PostId = post.Id,
                HashtagId = hashtag.Id,
                Hashtag = hashtag,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _postRepository.GetByIdAsync(post.Id, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        var dto = updated.ToResponseDto();
        return dto with { Author = await ResolveAuthorAsync(updated.UserId, cancellationToken) };
    }

    public async Task DeleteAsync(Guid postId, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdForUpdateAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        EnsureOwnerOrAdmin(post.UserId, userId, isAdmin, "You are not allowed to delete this post.");

        post.DeletedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<Hashtag>> GetOrCreateHashtagsAsync(string content, CancellationToken cancellationToken)
    {
        var normalizedNames = ExtractHashtags(content);
        if (normalizedNames.Count == 0)
        {
            return Array.Empty<Hashtag>();
        }

        var existing = await _hashtagRepository.GetByNormalizedNamesAsync(normalizedNames, cancellationToken);
        var existingByNormalizedName = existing.ToDictionary(hashtag => hashtag.NormalizedName, hashtag => hashtag);

        var missingHashtags = normalizedNames
            .Where(normalizedName => !existingByNormalizedName.ContainsKey(normalizedName))
            .Select(normalizedName => new Hashtag
            {
                Id = Guid.NewGuid(),
                Name = normalizedName,
                NormalizedName = normalizedName,
                CreatedAt = DateTime.UtcNow
            })
            .ToList();

        if (missingHashtags.Count > 0)
        {
            await _hashtagRepository.AddRangeAsync(missingHashtags, cancellationToken);
        }

        return existing.Concat(missingHashtags).ToList();
    }

    private static IReadOnlyList<string> ExtractHashtags(string content)
    {
        return HashtagRegex.Matches(content)
            .Select(match => match.Groups[1].Value.Trim().ToLowerInvariant())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct()
            .ToList();
    }

    private static void EnsureOwnerOrAdmin(Guid ownerId, Guid currentUserId, bool isAdmin, string error)
    {
        if (!isAdmin && ownerId != currentUserId)
        {
            throw new ForbiddenException(error);
        }
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
                "Falling back to default post author for user {UserId} while loading feed.",
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

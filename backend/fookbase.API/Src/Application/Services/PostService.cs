using System.Text.RegularExpressions;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Services;

public class PostService : IPostService
{
    private static readonly Regex HashtagRegex = new("#([A-Za-z0-9_]{1,50})", RegexOptions.Compiled);

    private readonly IPostRepository _postRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IHashtagRepository _hashtagRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PostService(
        IPostRepository postRepository,
        IJavaApiService javaApiService,
        IHashtagRepository hashtagRepository,
        IUnitOfWork unitOfWork)
    {
        _postRepository = postRepository;
        _javaApiService = javaApiService;
        _hashtagRepository = hashtagRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<PostResponseDto>> GetPagedAsync(PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var (items, totalCount) = await _postRepository.GetPagedAsync(query.Page, query.PageSize, cancellationToken);

        var mappedItems = items.Select(static post => post.ToResponseDto()).ToList();

        return PagedResult<PostResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post not found.");

        return post.ToResponseDto();
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

        return post.ToResponseDto();
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

        return updated.ToResponseDto();
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

}

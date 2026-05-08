using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class SavedPostService : ISavedPostService
{
    private readonly ISavedPostRepository _savedPostRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserReadModelService _userReadModelService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<SavedPostService> _logger;

    public SavedPostService(
        ISavedPostRepository savedPostRepository,
        IPostRepository postRepository,
        IUserReadModelService userReadModelService,
        IUnitOfWork unitOfWork,
        ILogger<SavedPostService> logger)
    {
        _savedPostRepository = savedPostRepository;
        _postRepository = postRepository;
        _userReadModelService = userReadModelService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PostResponseDto>> GetMineAsync(Guid userId, PaginationQuery query, CancellationToken cancellationToken)
    {
        query.Normalize();

        var blockedUserIds = await ResolveBlockedUserIdsAsync(userId, cancellationToken, requireFresh: true);
        var (items, totalCount) = await _savedPostRepository.GetPagedByUserAsync(
            userId,
            query.Page,
            query.PageSize,
            cancellationToken,
            blockedUserIds);

        var posts = items
            .Where(savedPost => savedPost.Post is not null)
            .Select(savedPost => savedPost.Post!)
            .ToList();

        var authors = await ResolveAuthorsAsync(posts.Select(post => post.UserId), cancellationToken);

        var mappedItems = posts
            .Select(post =>
            {
                var dto = post.ToResponseDto();
                var currentUserReactionType = GetCurrentUserReactionType(post, userId);
                return dto with
                {
                    Author = authors.TryGetValue(post.UserId, out var author)
                        ? author
                        : CreateFallbackAuthor(post.UserId),
                    CurrentUserReactionType = currentUserReactionType,
                    LikedByCurrentUser = currentUserReactionType is not null,
                    CommentCount = ResolveVisibleCommentCount(post, blockedUserIds)
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
            ?? throw new BusinessException(ErrorCode.POST_NOT_FOUND);

        var blockedUserIds = await ResolveBlockedUserIdsAsync(userId, cancellationToken);
        if (blockedUserIds.Contains(post.UserId))
        {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

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

    private async Task<Dictionary<Guid, AuthorSummaryDto>> ResolveAuthorsAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveAuthorsAsync(
            userIds,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");
    }

    private async Task<AuthorSummaryDto> ResolveAuthorAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _userReadModelService.ResolveAuthorAsync(
            userId,
            cancellationToken,
            requireFresh: false,
            fallbackDisplayName: "user");
    }

    private static AuthorSummaryDto CreateFallbackAuthor(Guid userId)
    {
        return new AuthorSummaryDto
        {
            Id = userId,
            DisplayName = "user",
            AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
        };
    }

    private static string? GetCurrentUserReactionType(Post post, Guid currentUserId)
    {
        var reaction = post.Likes.FirstOrDefault(like => like.UserId == currentUserId);
        if (reaction is null)
        {
            return null;
        }

        return reaction.Type.ToString();
    }

    private static int ResolveVisibleCommentCount(Post post, IReadOnlySet<Guid> blockedUserIds)
    {
        if (blockedUserIds.Count == 0)
        {
            return post.Comments.Count;
        }

        return post.Comments.Count(comment => !blockedUserIds.Contains(comment.UserId));
    }

    private async Task<HashSet<Guid>> ResolveBlockedUserIdsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        return await _userReadModelService.ResolveBlockedUserIdsAsync(
            currentUserId,
            cancellationToken,
            requireFresh: requireFresh);
    }

}

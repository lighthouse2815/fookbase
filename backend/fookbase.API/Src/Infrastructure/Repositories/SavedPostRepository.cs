using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class SavedPostRepository : ISavedPostRepository
{
    private readonly AppDbContext _context;

    public SavedPostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<SavedPost> Items, int TotalCount)> GetPagedByUserAsync(
        Guid userId,
        int page,
        int pageSize,
        Guid? viewerUserId,
        IReadOnlyCollection<Guid>? viewerFriendUserIds,
        CancellationToken cancellationToken,
        IReadOnlyCollection<Guid>? excludedPostOwnerUserIds = null)
    {
        var excludedIds = NormalizeExcludedUserIds(excludedPostOwnerUserIds);
        IQueryable<SavedPost> query = _context.SavedPosts
            .AsNoTracking()
            .Where(savedPost => savedPost.UserId == userId);

        // Exclude rows whose related post is filtered out by Post's query filter.
        query = query.Where(savedPost => savedPost.Post != null);

        query = ApplyPostVisibilityFilter(query, viewerUserId, viewerFriendUserIds);

        if (excludedIds.Count > 0)
        {
            query = query.Where(savedPost => !excludedIds.Contains(savedPost.Post!.UserId));
        }

        query = query
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.MediaItems)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.Likes)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.Comments)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.PostHashtags)
                    .ThenInclude(postHashtag => postHashtag.Hashtag)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.OriginalPost)
                    .ThenInclude(post => post!.MediaItems)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.OriginalPost)
                    .ThenInclude(post => post!.Likes)
            .Include(savedPost => savedPost.Post!)
                .ThenInclude(post => post.OriginalPost)
                    .ThenInclude(post => post!.Comments)
            .OrderByDescending(savedPost => savedPost.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<SavedPost?> GetByUserAndPostAsync(Guid userId, Guid postId, CancellationToken cancellationToken)
    {
        return _context.SavedPosts
            .AsNoTracking()
            .FirstOrDefaultAsync(savedPost => savedPost.UserId == userId && savedPost.PostId == postId, cancellationToken);
    }

    public Task<SavedPost?> GetByUserAndPostForUpdateAsync(Guid userId, Guid postId, CancellationToken cancellationToken)
    {
        return _context.SavedPosts
            .FirstOrDefaultAsync(savedPost => savedPost.UserId == userId && savedPost.PostId == postId, cancellationToken);
    }

    public Task AddAsync(SavedPost savedPost, CancellationToken cancellationToken)
    {
        return _context.SavedPosts.AddAsync(savedPost, cancellationToken).AsTask();
    }

    public void Remove(SavedPost savedPost)
    {
        _context.SavedPosts.Remove(savedPost);
    }

    private static IReadOnlyList<Guid> NormalizeExcludedUserIds(IReadOnlyCollection<Guid>? excludedUserIds)
    {
        return excludedUserIds?
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList()
            ?? [];
    }

    private static IQueryable<SavedPost> ApplyPostVisibilityFilter(
        IQueryable<SavedPost> query,
        Guid? viewerUserId,
        IReadOnlyCollection<Guid>? viewerFriendUserIds)
    {
        var normalizedFriendIds = viewerFriendUserIds?
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList()
            ?? [];

        if (!viewerUserId.HasValue || viewerUserId.Value == Guid.Empty)
        {
            return query.Where(savedPost =>
                savedPost.Post != null
                && savedPost.Post.Visibility == PostVisibility.PUBLIC);
        }

        var viewerId = viewerUserId.Value;
        return query.Where(savedPost =>
            savedPost.Post != null
            && (
                savedPost.Post.UserId == viewerId
                || savedPost.Post.Visibility == PostVisibility.PUBLIC
                || (savedPost.Post.Visibility == PostVisibility.FRIENDS
                    && normalizedFriendIds.Contains(savedPost.Post.UserId))
            ));
    }
}




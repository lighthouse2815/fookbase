using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class PostRepository : IPostRepository
{
    private readonly AppDbContext _context;

    public PostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken,
        IReadOnlyCollection<Guid>? excludedUserIds = null)
    {
        var excludedIds = NormalizeExcludedUserIds(excludedUserIds);
        IQueryable<Post> query = _context.Posts.AsNoTracking();

        if (excludedIds.Count > 0)
        {
            query = query.Where(post => !excludedIds.Contains(post.UserId));
        }

        query = query
            .Include(post => post.MediaItems)
            .Include(post => post.Likes)
            .Include(post => post.Comments)
            .Include(post => post.PostHashtags)
                .ThenInclude(postHashtag => postHashtag.Hashtag)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.MediaItems)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.Likes)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.Comments)
            .OrderByDescending(post => post.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    private static IReadOnlyList<Guid> NormalizeExcludedUserIds(IReadOnlyCollection<Guid>? excludedUserIds)
    {
        return excludedUserIds?
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList()
            ?? [];
    }

    public Task<Post?> GetByIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Posts
            .AsNoTracking()
            .Include(post => post.MediaItems)
            .Include(post => post.Likes)
            .Include(post => post.Comments)
            .Include(post => post.PostHashtags)
                .ThenInclude(postHashtag => postHashtag.Hashtag)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.MediaItems)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.Likes)
            .Include(post => post.OriginalPost)
                .ThenInclude(post => post!.Comments)
            .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
    }

    public Task<Post?> GetByIdForUpdateAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Posts
            .Include(post => post.MediaItems)
            .Include(post => post.PostHashtags)
            .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
    }

    public Task<int> CountByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _context.Posts.CountAsync(post => post.UserId == userId, cancellationToken);
    }

    public Task<int> CountAsync(CancellationToken cancellationToken)
    {
        return _context.Posts.CountAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DateTime>> GetCreatedDatesSinceAsync(DateTime sinceUtc, CancellationToken cancellationToken)
    {
        return await _context.Posts
            .AsNoTracking()
            .Where(post => post.CreatedAt >= sinceUtc)
            .Select(post => post.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, Guid>> GetOwnerUserIdsByPostIdsAsync(
        IReadOnlyCollection<Guid> postIds,
        CancellationToken cancellationToken)
    {
        if (postIds.Count == 0)
        {
            return new Dictionary<Guid, Guid>();
        }

        var pairs = await _context.Posts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(post => postIds.Contains(post.Id))
            .Select(post => new { post.Id, post.UserId })
            .ToListAsync(cancellationToken);

        return pairs.ToDictionary(pair => pair.Id, pair => pair.UserId);
    }

    public async Task<IReadOnlyDictionary<Guid, int>> GetShareCountsAsync(
        IReadOnlyCollection<Guid> originalPostIds,
        CancellationToken cancellationToken)
    {
        var normalizedIds = originalPostIds
            .Where(postId => postId != Guid.Empty)
            .Distinct()
            .ToList();
        if (normalizedIds.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        var rows = await _context.Posts
            .AsNoTracking()
            .Where(post => post.OriginalPostId.HasValue && normalizedIds.Contains(post.OriginalPostId.Value))
            .GroupBy(post => post.OriginalPostId!.Value)
            .Select(group => new
            {
                OriginalPostId = group.Key,
                Count = group.Count()
            })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(row => row.OriginalPostId, row => row.Count);
    }

    public Task<bool> HasSharedOriginalPostAsync(Guid userId, Guid originalPostId, CancellationToken cancellationToken)
    {
        return _context.Posts.AnyAsync(
            post => post.UserId == userId && post.OriginalPostId == originalPostId,
            cancellationToken);
    }

    public Task AddAsync(Post post, CancellationToken cancellationToken)
    {
        return _context.Posts.AddAsync(post, cancellationToken).AsTask();
    }
}




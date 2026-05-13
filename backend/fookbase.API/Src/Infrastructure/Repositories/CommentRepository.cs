using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly AppDbContext _context;

    public CommentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Comment> Items, int TotalCount)> GetPagedByPostIdAsync(
        Guid postId,
        int page,
        int pageSize,
        CancellationToken cancellationToken,
        IReadOnlyCollection<Guid>? excludedUserIds = null)
    {
        var excludedIds = NormalizeExcludedUserIds(excludedUserIds);
        var query = _context.Comments
            .AsNoTracking()
            .Include(comment => comment.MediaItems)
            .Where(comment => comment.PostId == postId && comment.ParentCommentId == null);

        if (excludedIds.Count > 0)
        {
            query = query.Where(comment => !excludedIds.Contains(comment.UserId));
        }

        query = query.OrderBy(comment => comment.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<Comment>> GetByPostIdAsync(
        Guid postId,
        CancellationToken cancellationToken,
        IReadOnlyCollection<Guid>? excludedUserIds = null)
    {
        var excludedIds = NormalizeExcludedUserIds(excludedUserIds);
        var query = _context.Comments
            .AsNoTracking()
            .Include(comment => comment.MediaItems)
            .Where(comment => comment.PostId == postId);

        if (excludedIds.Count > 0)
        {
            query = query.Where(comment => !excludedIds.Contains(comment.UserId));
        }

        return await query
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Comment>> GetByPostIdForUpdateAsync(Guid postId, CancellationToken cancellationToken)
    {
        return await _context.Comments
            .Include(comment => comment.MediaItems)
            .Where(comment => comment.PostId == postId)
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Comments
            .AsNoTracking()
            .CountAsync(comment => comment.PostId == postId, cancellationToken);
    }

    public Task<Comment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return _context.Comments
            .Include(comment => comment.MediaItems)
            .FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, Guid>> GetOwnerUserIdsByCommentIdsAsync(
        IReadOnlyCollection<Guid> commentIds,
        CancellationToken cancellationToken)
    {
        if (commentIds.Count == 0)
        {
            return new Dictionary<Guid, Guid>();
        }

        var pairs = await _context.Comments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(comment => commentIds.Contains(comment.Id))
            .Select(comment => new { comment.Id, comment.UserId })
            .ToListAsync(cancellationToken);

        return pairs.ToDictionary(pair => pair.Id, pair => pair.UserId);
    }

    public Task AddAsync(Comment comment, CancellationToken cancellationToken)
    {
        return _context.Comments.AddAsync(comment, cancellationToken).AsTask();
    }

    private static IReadOnlyList<Guid> NormalizeExcludedUserIds(IReadOnlyCollection<Guid>? excludedUserIds)
    {
        return excludedUserIds?
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList()
            ?? [];
    }
}




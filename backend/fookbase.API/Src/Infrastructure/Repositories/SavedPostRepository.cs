using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
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
        CancellationToken cancellationToken)
    {
        var query = _context.SavedPosts
            .AsNoTracking()
            .Where(savedPost => savedPost.UserId == userId)
            .Include(savedPost => savedPost.Post)
                .ThenInclude(post => post.Likes)
            .Include(savedPost => savedPost.Post)
                .ThenInclude(post => post.Comments)
            .Include(savedPost => savedPost.Post)
                .ThenInclude(post => post.PostHashtags)
                    .ThenInclude(postHashtag => postHashtag.Hashtag)
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
}

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

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.Posts
            .AsNoTracking()
            .Include(post => post.Likes)
            .Include(post => post.Comments)
            .Include(post => post.PostHashtags)
                .ThenInclude(postHashtag => postHashtag.Hashtag)
            .OrderByDescending(post => post.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Post?> GetByIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Posts
            .AsNoTracking()
            .Include(post => post.Likes)
            .Include(post => post.Comments)
            .Include(post => post.PostHashtags)
                .ThenInclude(postHashtag => postHashtag.Hashtag)
            .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
    }

    public Task<Post?> GetByIdForUpdateAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Posts
            .Include(post => post.PostHashtags)
            .FirstOrDefaultAsync(post => post.Id == postId, cancellationToken);
    }

    public Task AddAsync(Post post, CancellationToken cancellationToken)
    {
        return _context.Posts.AddAsync(post, cancellationToken).AsTask();
    }
}
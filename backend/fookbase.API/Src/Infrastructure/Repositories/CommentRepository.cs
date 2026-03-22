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

    public async Task<(IReadOnlyList<Comment> Items, int TotalCount)> GetPagedByPostIdAsync(Guid postId, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.Comments
            .AsNoTracking()
            .Where(comment => comment.PostId == postId)
            .OrderBy(comment => comment.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Comment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return _context.Comments.FirstOrDefaultAsync(comment => comment.Id == commentId, cancellationToken);
    }

    public Task AddAsync(Comment comment, CancellationToken cancellationToken)
    {
        return _context.Comments.AddAsync(comment, cancellationToken).AsTask();
    }
}
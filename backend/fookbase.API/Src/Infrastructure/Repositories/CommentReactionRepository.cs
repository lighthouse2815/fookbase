using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class CommentReactionRepository : ICommentReactionRepository
{
    private readonly AppDbContext _context;

    public CommentReactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<CommentReaction?> GetByCommentAndUserAsync(Guid commentId, Guid userId, CancellationToken cancellationToken)
    {
        return _context.CommentReactions
            .FirstOrDefaultAsync(reaction => reaction.CommentId == commentId && reaction.UserId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<CommentReaction>> GetByCommentIdAsync(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        return await _context.CommentReactions
            .AsNoTracking()
            .Where(reaction => reaction.CommentId == commentId)
            .OrderByDescending(reaction => reaction.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CommentReaction>> GetByCommentIdsAsync(
        IReadOnlyCollection<Guid> commentIds,
        CancellationToken cancellationToken)
    {
        if (commentIds.Count == 0)
        {
            return Array.Empty<CommentReaction>();
        }

        return await _context.CommentReactions
            .AsNoTracking()
            .Where(reaction => commentIds.Contains(reaction.CommentId))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CommentReaction>> GetByCommentIdsAndUserAsync(
        IReadOnlyCollection<Guid> commentIds,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (commentIds.Count == 0)
        {
            return Array.Empty<CommentReaction>();
        }

        return await _context.CommentReactions
            .AsNoTracking()
            .Where(reaction => reaction.UserId == userId && commentIds.Contains(reaction.CommentId))
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(CommentReaction reaction, CancellationToken cancellationToken)
    {
        return _context.CommentReactions.AddAsync(reaction, cancellationToken).AsTask();
    }

    public void Remove(CommentReaction reaction)
    {
        _context.CommentReactions.Remove(reaction);
    }
}

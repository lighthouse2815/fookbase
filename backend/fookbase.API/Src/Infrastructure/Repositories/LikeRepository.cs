using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class LikeRepository : ILikeRepository
{
    private readonly AppDbContext _context;

    public LikeRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Like?> GetByPostAndUserAsync(Guid postId, Guid userId, CancellationToken cancellationToken)
    {
        return _context.Likes.FirstOrDefaultAsync(like => like.PostId == postId && like.UserId == userId, cancellationToken);
    }

    public Task<int> CountByPostIdAsync(Guid postId, CancellationToken cancellationToken)
    {
        return _context.Likes.CountAsync(like => like.PostId == postId, cancellationToken);
    }

    public Task AddAsync(Like like, CancellationToken cancellationToken)
    {
        return _context.Likes.AddAsync(like, cancellationToken).AsTask();
    }

    public void Remove(Like like)
    {
        _context.Likes.Remove(like);
    }
}
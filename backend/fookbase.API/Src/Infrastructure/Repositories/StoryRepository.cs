using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class StoryRepository : IStoryRepository
{
    private readonly AppDbContext _context;

    public StoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedActiveAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var query = _context.Stories
            .AsNoTracking()
            .Where(story => story.ExpiresAt > now)
            .OrderByDescending(story => story.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.Stories
            .AsNoTracking()
            .Where(story => story.UserId == userId)
            .OrderByDescending(story => story.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Story?> GetByIdAsync(Guid storyId, CancellationToken cancellationToken)
    {
        return _context.Stories
            .AsNoTracking()
            .FirstOrDefaultAsync(story => story.Id == storyId, cancellationToken);
    }

    public Task<Story?> GetByIdForUpdateAsync(Guid storyId, CancellationToken cancellationToken)
    {
        return _context.Stories
            .FirstOrDefaultAsync(story => story.Id == storyId, cancellationToken);
    }

    public Task AddAsync(Story story, CancellationToken cancellationToken)
    {
        return _context.Stories.AddAsync(story, cancellationToken).AsTask();
    }
}
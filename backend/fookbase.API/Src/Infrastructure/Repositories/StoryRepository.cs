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

    public async Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedFeedAsync(
        IReadOnlyCollection<Guid> userIds,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return (Array.Empty<Story>(), 0);
        }

        var now = DateTime.UtcNow;

        var query = _context.Stories
            .AsNoTracking()
            .Include(story => story.Views)
            .Where(story => story.ExpiredAt > now && userIds.Contains(story.UserId))
            .OrderByDescending(story => story.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<Story> Items, int TotalCount)> GetPagedActiveByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var query = _context.Stories
            .AsNoTracking()
            .Include(story => story.Views)
            .Where(story => story.UserId == userId && story.ExpiredAt > now)
            .OrderBy(story => story.CreatedAt);

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
            .Include(story => story.Views)
            .FirstOrDefaultAsync(story => story.Id == storyId, cancellationToken);
    }

    public Task<Story?> GetByIdForUpdateAsync(Guid storyId, CancellationToken cancellationToken)
    {
        return _context.Stories
            .Include(story => story.Views)
            .FirstOrDefaultAsync(story => story.Id == storyId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, Guid>> GetOwnerUserIdsByStoryIdsAsync(
        IReadOnlyCollection<Guid> storyIds,
        CancellationToken cancellationToken)
    {
        if (storyIds.Count == 0)
        {
            return new Dictionary<Guid, Guid>();
        }

        var pairs = await _context.Stories
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(story => storyIds.Contains(story.Id))
            .Select(story => new { story.Id, story.UserId })
            .ToListAsync(cancellationToken);

        return pairs.ToDictionary(pair => pair.Id, pair => pair.UserId);
    }

    public Task<bool> HasViewAsync(Guid storyId, Guid viewerId, CancellationToken cancellationToken)
    {
        return _context.StoryViews.AnyAsync(
            storyView => storyView.StoryId == storyId && storyView.ViewerId == viewerId,
            cancellationToken);
    }

    public Task AddAsync(Story story, CancellationToken cancellationToken)
    {
        return _context.Stories.AddAsync(story, cancellationToken).AsTask();
    }

    public Task AddViewAsync(StoryView storyView, CancellationToken cancellationToken)
    {
        return _context.StoryViews.AddAsync(storyView, cancellationToken).AsTask();
    }
}

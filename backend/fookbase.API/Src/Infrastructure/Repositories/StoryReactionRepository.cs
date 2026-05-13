using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class StoryReactionRepository : IStoryReactionRepository
{
    private readonly AppDbContext _context;

    public StoryReactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<StoryReaction?> GetByStoryAndUserAsync(Guid storyId, Guid userId, CancellationToken cancellationToken)
    {
        return _context.StoryReactions
            .FirstOrDefaultAsync(reaction => reaction.StoryId == storyId && reaction.UserId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<StoryReaction>> GetByStoryIdsAndUserAsync(
        IReadOnlyCollection<Guid> storyIds,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (storyIds.Count == 0)
        {
            return Array.Empty<StoryReaction>();
        }

        return await _context.StoryReactions
            .AsNoTracking()
            .Where(reaction => reaction.UserId == userId && storyIds.Contains(reaction.StoryId))
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(StoryReaction reaction, CancellationToken cancellationToken)
    {
        return _context.StoryReactions.AddAsync(reaction, cancellationToken).AsTask();
    }

    public void Remove(StoryReaction reaction)
    {
        _context.StoryReactions.Remove(reaction);
    }
}




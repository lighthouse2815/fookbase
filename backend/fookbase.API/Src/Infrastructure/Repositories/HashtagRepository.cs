using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class HashtagRepository : IHashtagRepository
{
    private readonly AppDbContext _context;

    public HashtagRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Hashtag> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.Hashtags
            .AsNoTracking()
            .OrderBy(hashtag => hashtag.Name);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<Hashtag> Items, int TotalCount)> SearchPagedAsync(string keyword, int page, int pageSize, CancellationToken cancellationToken)
    {
        var normalizedKeyword = keyword.Trim().ToLowerInvariant();

        var query = _context.Hashtags
            .AsNoTracking()
            .Where(hashtag => hashtag.Name.Contains(normalizedKeyword))
            .OrderBy(hashtag => hashtag.Name);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Hashtag?> GetByIdAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        return _context.Hashtags
            .AsNoTracking()
            .FirstOrDefaultAsync(hashtag => hashtag.Id == hashtagId, cancellationToken);
    }

    public Task<Hashtag?> GetByIdForUpdateAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        return _context.Hashtags.FirstOrDefaultAsync(hashtag => hashtag.Id == hashtagId, cancellationToken);
    }

    public Task<Hashtag?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        return _context.Hashtags.FirstOrDefaultAsync(hashtag => hashtag.Name == name, cancellationToken);
    }

    public Task<int> CountPostUsageAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        return _context.PostHashtags.CountAsync(postHashtag => postHashtag.HashtagId == hashtagId, cancellationToken);
    }

    public async Task<IReadOnlyList<Hashtag>> GetByNamesAsync(IEnumerable<string> names, CancellationToken cancellationToken)
    {
        var nameList = names.ToList();

        return await _context.Hashtags
            .Where(hashtag => nameList.Contains(hashtag.Name))
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(Hashtag hashtag, CancellationToken cancellationToken)
    {
        return _context.Hashtags.AddAsync(hashtag, cancellationToken).AsTask();
    }

    public Task AddRangeAsync(IEnumerable<Hashtag> hashtags, CancellationToken cancellationToken)
    {
        return _context.Hashtags.AddRangeAsync(hashtags, cancellationToken);
    }

    public void Remove(Hashtag hashtag)
    {
        _context.Hashtags.Remove(hashtag);
    }
}




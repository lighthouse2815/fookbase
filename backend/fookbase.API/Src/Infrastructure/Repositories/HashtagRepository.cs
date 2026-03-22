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
            .OrderBy(hashtag => hashtag.NormalizedName);

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
            .Where(hashtag => hashtag.NormalizedName.Contains(normalizedKeyword))
            .OrderBy(hashtag => hashtag.NormalizedName);

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

    public Task<Hashtag?> GetByNormalizedNameAsync(string normalizedName, CancellationToken cancellationToken)
    {
        return _context.Hashtags.FirstOrDefaultAsync(hashtag => hashtag.NormalizedName == normalizedName, cancellationToken);
    }

    public Task<int> CountPostUsageAsync(Guid hashtagId, CancellationToken cancellationToken)
    {
        return _context.PostHashtags.CountAsync(postHashtag => postHashtag.HashtagId == hashtagId, cancellationToken);
    }

    public async Task<IReadOnlyList<Hashtag>> GetByNormalizedNamesAsync(IEnumerable<string> normalizedNames, CancellationToken cancellationToken)
    {
        var normalizedNameList = normalizedNames.ToList();

        return await _context.Hashtags
            .Where(hashtag => normalizedNameList.Contains(hashtag.NormalizedName))
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
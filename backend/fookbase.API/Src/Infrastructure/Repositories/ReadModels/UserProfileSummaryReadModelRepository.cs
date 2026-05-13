using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteractHub.Api.Infrastructure.Repositories;

public class UserProfileSummaryReadModelRepository : IUserProfileSummaryReadModelRepository
{
    private readonly AppDbContext _context;

    public UserProfileSummaryReadModelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<Guid, UserProfileSummaryReadModel>> GetByUserIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryReadModel>();
        }

        return await _context.UserProfileSummaryReadModels
            .Where(profile => userIds.Contains(profile.UserId))
            .ToDictionaryAsync(profile => profile.UserId, cancellationToken);
    }

    public Task<UserProfileSummaryReadModel?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _context.UserProfileSummaryReadModels
            .FirstOrDefaultAsync(profile => profile.UserId == userId, cancellationToken);
    }

    public void Add(UserProfileSummaryReadModel profile)
    {
        _context.UserProfileSummaryReadModels.Add(profile);
    }
}




using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class FriendshipReadModelMapper
{
    public static Dictionary<Guid, DateTime> ToBlockedUsersLookup(IEnumerable<FriendshipReadModel> relations)
    {
        ArgumentNullException.ThrowIfNull(relations);

        return relations
            .Where(relation => relation.Status == FriendshipStatus.BLOCKED)
            .GroupBy(relation => relation.OtherUserId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(relation => relation.UpdatedAtUtc)
                    .First()
                    .UpdatedAtUtc);
    }

    public static HashSet<Guid> ToBlockedUserIds(IEnumerable<string> blockedUserIds, Guid ownerUserId)
    {
        ArgumentNullException.ThrowIfNull(blockedUserIds);

        return blockedUserIds
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .Select(TryParseGuid)
            .Where(parsedUserId => parsedUserId.HasValue && parsedUserId.Value != ownerUserId)
            .Select(parsedUserId => parsedUserId!.Value)
            .ToHashSet();
    }

    public static HashSet<Guid> ToContactUserIds(IEnumerable<ContactDto> contacts, Guid ownerUserId)
    {
        ArgumentNullException.ThrowIfNull(contacts);

        return contacts
            .Where(contact => !string.IsNullOrWhiteSpace(contact.UserId))
            .Select(contact => TryParseGuid(contact.UserId))
            .Where(parsedUserId => parsedUserId.HasValue && parsedUserId.Value != ownerUserId)
            .Select(parsedUserId => parsedUserId!.Value)
            .ToHashSet();
    }

    private static Guid? TryParseGuid(string input)
    {
        return Guid.TryParse(input, out var parsedUserId) ? parsedUserId : null;
    }
}

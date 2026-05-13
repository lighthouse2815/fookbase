using System.Text.Json;

namespace InteractHub.Api.Application.Mappers;

public static class RabbitMqReadModelEventMapper
{
    private static readonly HashSet<string> ProfileEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "user.profile.updated",
        "user_profile_updated",
        "profile.updated",
        "user-summary-updated",
        "user.summary.updated"
    };

    private static readonly HashSet<string> BlockEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "user.blocked",
        "user.unblocked",
        "friendship.blocked",
        "friendship.unblocked",
        "user.block.status.changed",
        "user_block_status_changed"
    };

    private static readonly HashSet<string> FriendshipActiveEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "friendship.created",
        "friendship.accepted",
        "friendship.restored",
        "friendship.active",
        "friendship_active"
    };

    private static readonly HashSet<string> FriendshipInactiveEventTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "friendship.removed",
        "friendship.rejected",
        "friendship.cancelled",
        "friendship.inactive",
        "friendship_inactive"
    };

    public static JsonElement ResolvePayload(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("payload", out var payload)
            && payload.ValueKind == JsonValueKind.Object)
        {
            return payload;
        }

        return root;
    }

    public static string ResolveEventType(JsonElement root)
    {
        var candidates = new[]
        {
            GetString(root, "eventType"),
            GetString(root, "type"),
            GetString(root, "name")
        };

        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return candidate.Trim();
            }
        }

        return "unknown";
    }

    public static DateTime? ResolveObservedAtUtc(JsonElement root, JsonElement payload)
    {
        var candidates = new[]
        {
            GetDateTime(root, "occurredAt"),
            GetDateTime(root, "timestamp"),
            GetDateTime(root, "createdAt"),
            GetDateTime(payload, "occurredAt"),
            GetDateTime(payload, "updatedAt"),
            GetDateTime(payload, "createdAt")
        };

        return candidates.FirstOrDefault(candidate => candidate.HasValue);
    }

    public static bool IsProfileEvent(string eventType, JsonElement payload)
    {
        if (ProfileEventTypes.Contains(eventType))
        {
            return true;
        }

        return HasAnyProperty(payload, "displayName", "avatarUrl");
    }

    public static bool IsBlockEvent(string eventType, JsonElement payload)
    {
        if (BlockEventTypes.Contains(eventType))
        {
            return true;
        }

        return HasAnyProperty(payload, "blockedUserId", "targetUserId", "addresseeId", "otherUserId")
            && (HasAnyProperty(payload, "ownerUserId", "userId", "requesterId")
                || HasAnyProperty(payload, "actorUserId"));
    }

    public static bool IsFriendshipEvent(string eventType, JsonElement payload, out bool defaultIsActive)
    {
        if (FriendshipActiveEventTypes.Contains(eventType))
        {
            defaultIsActive = true;
            return true;
        }

        if (FriendshipInactiveEventTypes.Contains(eventType))
        {
            defaultIsActive = false;
            return true;
        }

        if (HasAnyProperty(payload, "firstUserId", "requesterId", "userId", "userA")
            && HasAnyProperty(payload, "secondUserId", "addresseeId", "friendUserId", "userB"))
        {
            defaultIsActive = true;
            return true;
        }

        defaultIsActive = false;
        return false;
    }

    public static bool TryResolveProfile(JsonElement payload, out (Guid UserId, string? DisplayName, string? AvatarUrl) profile)
    {
        profile = default;
        if (!TryReadGuid(payload, out var userId, "userId", "id"))
        {
            return false;
        }

        profile = (
            UserId: userId,
            DisplayName: GetString(payload, "displayName"),
            AvatarUrl: GetString(payload, "avatarUrl"));
        return true;
    }

    public static bool TryResolveBlockEvent(JsonElement payload, out (Guid OwnerUserId, Guid BlockedUserId, bool IsBlocked) blockEvent)
    {
        blockEvent = default;
        if (!TryReadGuid(payload, out var ownerUserId, "ownerUserId", "userId", "requesterId", "actorUserId"))
        {
            return false;
        }

        if (!TryReadGuid(payload, out var blockedUserId, "blockedUserId", "targetUserId", "addresseeId", "otherUserId"))
        {
            return false;
        }

        var isBlocked = GetBoolean(payload, "isBlocked") ?? true;
        blockEvent = (ownerUserId, blockedUserId, isBlocked);
        return true;
    }

    public static bool TryResolveFriendshipEvent(
        JsonElement payload,
        bool defaultIsActive,
        out (Guid FirstUserId, Guid SecondUserId, bool IsActive) friendshipEvent)
    {
        friendshipEvent = default;
        if (!TryReadFriendshipUsers(payload, out var firstUserId, out var secondUserId))
        {
            return false;
        }

        var isActive = GetBoolean(payload, "isActive");
        if (!isActive.HasValue)
        {
            var status = GetString(payload, "status");
            if (!string.IsNullOrWhiteSpace(status))
            {
                isActive = status.Equals("accepted", StringComparison.OrdinalIgnoreCase)
                    || status.Equals("active", StringComparison.OrdinalIgnoreCase)
                    || status.Equals("friends", StringComparison.OrdinalIgnoreCase);
            }
        }

        friendshipEvent = (firstUserId, secondUserId, isActive ?? defaultIsActive);
        return true;
    }

    private static bool TryReadFriendshipUsers(JsonElement payload, out Guid firstUserId, out Guid secondUserId)
    {
        firstUserId = Guid.Empty;
        secondUserId = Guid.Empty;

        if (TryReadGuid(payload, out firstUserId, "firstUserId", "requesterId", "userId", "userA")
            && TryReadGuid(payload, out secondUserId, "secondUserId", "addresseeId", "friendUserId", "userB"))
        {
            return firstUserId != Guid.Empty && secondUserId != Guid.Empty && firstUserId != secondUserId;
        }

        return false;
    }

    private static bool TryReadGuid(JsonElement source, out Guid value, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!source.TryGetProperty(propertyName, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.String
                && Guid.TryParse(property.GetString(), out value))
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.Object
                && property.TryGetProperty("id", out var idElement)
                && idElement.ValueKind == JsonValueKind.String
                && Guid.TryParse(idElement.GetString(), out value))
            {
                return true;
            }
        }

        value = Guid.Empty;
        return false;
    }

    private static bool? GetBoolean(JsonElement source, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!source.TryGetProperty(propertyName, out var property))
            {
                continue;
            }

            if (property.ValueKind == JsonValueKind.True)
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.False)
            {
                return false;
            }

            if (property.ValueKind == JsonValueKind.String
                && bool.TryParse(property.GetString(), out var parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static DateTime? GetDateTime(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        if (property.ValueKind == JsonValueKind.String
            && DateTime.TryParse(property.GetString(), out var parsed))
        {
            return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
        }

        return null;
    }

    private static string? GetString(JsonElement source, string propertyName)
    {
        if (!source.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String ? property.GetString() : null;
    }

    private static bool HasAnyProperty(JsonElement source, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (source.TryGetProperty(propertyName, out _))
            {
                return true;
            }
        }

        return false;
    }
}

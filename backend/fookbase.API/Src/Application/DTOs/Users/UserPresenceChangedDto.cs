namespace InteractHub.Api.Application.DTOs.Users;

public sealed class UserPresenceChangedDto
{
    public Guid UserId { get; init; }

    public bool IsOnline { get; init; }

    public DateTime? LastSeenAtUtc { get; init; }

    public DateTime? ObservedAtUtc { get; init; }
}


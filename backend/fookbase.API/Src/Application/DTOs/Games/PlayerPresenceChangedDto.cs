namespace InteractHub.Api.Application.DTOs.Games;

public sealed class PlayerPresenceChangedDto
{
    public Guid RoomId { get; init; }

    public Guid UserId { get; init; }

    public required string DisplayName { get; init; }

    public bool IsConnected { get; init; }

    public bool IsDisconnectedEvent { get; init; }
}




namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameRoomPlayerDto
{
    public Guid UserId { get; init; }

    public required string DisplayName { get; init; }

    public required string AvatarUrl { get; init; }

    public bool IsHost { get; init; }

    public bool IsConnected { get; init; }

    public DateTime JoinedAt { get; init; }
}




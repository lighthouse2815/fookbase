namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameStateUpdatedDto
{
    public Guid RoomId { get; init; }

    public required string GameType { get; init; }

    public required object State { get; init; }
}


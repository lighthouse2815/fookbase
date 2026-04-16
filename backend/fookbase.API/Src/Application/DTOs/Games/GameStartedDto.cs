namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameStartedDto
{
    public Guid RoomId { get; init; }

    public required string GameType { get; init; }

    public required object State { get; init; }

    public DateTime StartedAt { get; init; }
}


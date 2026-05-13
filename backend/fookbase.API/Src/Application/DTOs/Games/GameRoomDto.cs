namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameRoomDto
{
    public Guid RoomId { get; init; }

    public required string RoomCode { get; init; }

    public required string GameType { get; init; }

    public Guid HostUserId { get; init; }

    public int MaxPlayers { get; init; }

    public required string Status { get; init; }

    public DateTime CreatedAt { get; init; }

    public bool IsDeleted { get; init; }

    public IReadOnlyList<GameRoomPlayerDto> Players { get; init; } = Array.Empty<GameRoomPlayerDto>();
}




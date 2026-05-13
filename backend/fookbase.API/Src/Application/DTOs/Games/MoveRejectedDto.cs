namespace InteractHub.Api.Application.DTOs.Games;

public sealed class MoveRejectedDto
{
    public Guid RoomId { get; init; }

    public required string GameType { get; init; }

    public required string Reason { get; init; }
}





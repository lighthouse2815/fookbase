namespace InteractHub.Api.Application.DTOs.Games;

public sealed class MoveAcceptedDto
{
    public Guid RoomId { get; init; }

    public required string GameType { get; init; }

    public Guid UserId { get; init; }

    public string? Message { get; init; }

    public object? Move { get; init; }
}





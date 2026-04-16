namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameOverDto
{
    public Guid RoomId { get; init; }

    public required string GameType { get; init; }

    public Guid? WinnerUserId { get; init; }

    public bool IsDraw { get; init; }

    public required string Reason { get; init; }

    public object? FinalState { get; init; }
}


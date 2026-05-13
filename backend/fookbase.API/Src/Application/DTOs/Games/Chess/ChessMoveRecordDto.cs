namespace InteractHub.Api.Application.DTOs.Games.Chess;

public sealed class ChessMoveRecordDto
{
    public int MoveNumber { get; init; }

    public Guid UserId { get; init; }

    public required string From { get; init; }

    public required string To { get; init; }

    public string? Promotion { get; init; }

    public required string Notation { get; init; }

    public DateTime MovedAt { get; init; }
}





namespace InteractHub.Api.Application.DTOs.Games.Chess;

public sealed class ChessStateDto
{
    public Guid RoomId { get; init; }

    public required string Fen { get; init; }

    public Guid WhiteUserId { get; init; }

    public Guid BlackUserId { get; init; }

    public Guid CurrentTurnUserId { get; init; }

    public bool IsCheck { get; init; }

    public Guid? CheckedUserId { get; init; }

    public bool IsCheckmate { get; init; }

    public bool IsStalemate { get; init; }

    public bool IsFinished { get; init; }

    public Guid? WinnerUserId { get; init; }

    public string? EndReason { get; init; }

    public IReadOnlyList<ChessMoveRecordDto> MoveHistory { get; init; } = Array.Empty<ChessMoveRecordDto>();
}





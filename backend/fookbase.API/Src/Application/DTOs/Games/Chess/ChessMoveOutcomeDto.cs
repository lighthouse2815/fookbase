using InteractHub.Api.Application.DTOs.Games;

namespace InteractHub.Api.Application.DTOs.Games.Chess;

public sealed class ChessMoveOutcomeDto
{
    public bool Accepted { get; init; }

    public string? Error { get; init; }

    public ChessMoveRecordDto? Move { get; init; }

    public ChessStateDto? State { get; init; }

    public GameOverDto? GameOver { get; init; }
}





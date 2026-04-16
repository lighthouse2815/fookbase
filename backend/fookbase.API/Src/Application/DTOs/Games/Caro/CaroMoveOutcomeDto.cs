using InteractHub.Api.Application.DTOs.Games;

namespace InteractHub.Api.Application.DTOs.Games.Caro;

public sealed class CaroMoveOutcomeDto
{
    public bool Accepted { get; init; }

    public string? Error { get; init; }

    public CaroMoveRecordDto? Move { get; init; }

    public CaroStateDto? State { get; init; }

    public GameOverDto? GameOver { get; init; }
}


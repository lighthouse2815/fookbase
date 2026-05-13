namespace InteractHub.Api.Application.DTOs.Games.Caro;

public sealed class CaroMoveRecordDto
{
    public int Turn { get; init; }

    public Guid UserId { get; init; }

    public required string Symbol { get; init; }

    public int Row { get; init; }

    public int Col { get; init; }

    public DateTime MovedAt { get; init; }
}





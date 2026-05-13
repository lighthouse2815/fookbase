namespace InteractHub.Api.Application.DTOs.Games.Caro;

public sealed class CaroStateDto
{
    public Guid RoomId { get; init; }

    public int BoardSize { get; init; }

    public Guid XUserId { get; init; }

    public Guid OUserId { get; init; }

    public Guid CurrentTurnUserId { get; init; }

    public string?[][] Board { get; init; } = Array.Empty<string?[]>();

    public CaroMoveRecordDto? LastMove { get; init; }

    public IReadOnlyList<CaroMoveRecordDto> MoveHistory { get; init; } = Array.Empty<CaroMoveRecordDto>();

    public bool IsFinished { get; init; }

    public Guid? WinnerUserId { get; init; }

    public bool IsDraw { get; init; }

    public string? EndReason { get; init; }
}





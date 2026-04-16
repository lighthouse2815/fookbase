namespace InteractHub.Api.Application.DTOs.Games.Snake;

public sealed class SnakeStateDto
{
    public Guid RoomId { get; init; }

    public required string Phase { get; init; }

    public int Countdown { get; init; }

    public int Tick { get; init; }

    public int Width { get; init; }

    public int Height { get; init; }

    public bool IsWallFatal { get; init; }

    public required GridPointDto Fruit { get; init; }

    public IReadOnlyList<SnakePlayerStateDto> Players { get; init; } = Array.Empty<SnakePlayerStateDto>();

    public Guid? WinnerUserId { get; init; }

    public bool IsDraw { get; init; }

    public string? EndReason { get; init; }
}


namespace InteractHub.Api.Application.DTOs.Games.Flappy;

public sealed class FlappyStateDto
{
    public Guid RoomId { get; init; }

    public required string Phase { get; init; }

    public int Countdown { get; init; }

    public int Tick { get; init; }

    public double Width { get; init; }

    public double Height { get; init; }

    public double GroundHeight { get; init; }

    public IReadOnlyList<FlappyPlayerStateDto> Players { get; init; } = Array.Empty<FlappyPlayerStateDto>();

    public IReadOnlyList<FlappyPipeDto> Pipes { get; init; } = Array.Empty<FlappyPipeDto>();

    public Guid? WinnerUserId { get; init; }

    public bool IsDraw { get; init; }

    public string? EndReason { get; init; }
}

namespace InteractHub.Api.Application.DTOs.Games.Snake;

public sealed class SnakePlayerStateDto
{
    public Guid UserId { get; init; }

    public required string DisplayName { get; init; }

    public required string AvatarUrl { get; init; }

    public required string Color { get; init; }

    public required string Direction { get; init; }

    public IReadOnlyList<GridPointDto> Segments { get; init; } = Array.Empty<GridPointDto>();

    public int Score { get; init; }

    public int Length { get; init; }

    public bool IsAlive { get; init; }
}


namespace InteractHub.Api.Application.DTOs.Games.Flappy;

public sealed class FlappyPlayerStateDto
{
    public Guid UserId { get; init; }

    public required string DisplayName { get; init; }

    public required string AvatarUrl { get; init; }

    public double X { get; init; }

    public double Y { get; init; }

    public double VelocityY { get; init; }

    public int Score { get; init; }

    public bool IsAlive { get; init; }
}





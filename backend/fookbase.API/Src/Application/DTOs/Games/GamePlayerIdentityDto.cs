namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GamePlayerIdentityDto
{
    public Guid UserId { get; init; }

    public required string DisplayName { get; init; }

    public required string AvatarUrl { get; init; }
}




namespace InteractHub.Api.Application.DTOs.Games;

public sealed class GameDefinitionDto
{
    public required string GameType { get; init; }

    public required string Name { get; init; }

    public required string Description { get; init; }

    public required string RoutePath { get; init; }

    public int MaxPlayers { get; init; }
}

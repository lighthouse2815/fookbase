namespace InteractHub.Api.Application.Services.Games;

public static class GameHubGroups
{
    public const string Lobby = "games:lobby";

    public static string Room(Guid roomId)
    {
        return $"games:room:{roomId:D}";
    }
}


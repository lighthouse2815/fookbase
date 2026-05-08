namespace InteractHub.Api.Application.Services.Games;

public static class GameHubEventNames
{
    public const string RoomCreated = "RoomCreated";
    public const string RoomUpdated = "RoomUpdated";
    public const string PlayerJoined = "PlayerJoined";
    public const string PlayerLeft = "PlayerLeft";
    public const string GameStarted = "GameStarted";
    public const string GameStateUpdated = "GameStateUpdated";
    public const string MoveAccepted = "MoveAccepted";
    public const string MoveRejected = "MoveRejected";
    public const string GameOver = "GameOver";
    public const string RematchRequested = "RematchRequested";
    public const string RematchAccepted = "RematchAccepted";
}

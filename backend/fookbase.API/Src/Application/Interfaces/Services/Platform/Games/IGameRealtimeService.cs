namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface IGameRealtimeService
{
    Task BroadcastToLobbyAsync(
        string eventName,
        object payload,
        CancellationToken cancellationToken = default);

    Task BroadcastToRoomAsync(
        Guid roomId,
        string eventName,
        object payload,
        CancellationToken cancellationToken = default);
}




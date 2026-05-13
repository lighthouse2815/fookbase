using InteractHub.Api.Application.Interfaces.Services.Games;
using InteractHub.Api.Application.Services.Games;
using InteractHub.Api.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Api.Infrastructure.Services;

public sealed class SignalRGameRealtimeService : IGameRealtimeService
{
    private readonly IHubContext<GamesHub> _hubContext;

    public SignalRGameRealtimeService(IHubContext<GamesHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task BroadcastToLobbyAsync(string eventName, object payload, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.Group(GameHubGroups.Lobby).SendAsync(eventName, payload, cancellationToken);
    }

    public Task BroadcastToRoomAsync(Guid roomId, string eventName, object payload, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.Group(GameHubGroups.Room(roomId)).SendAsync(eventName, payload, cancellationToken);
    }
}




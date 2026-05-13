using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Presentation.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Api.Infrastructure.Services;

public sealed class SignalRPresenceRealtimeService : IPresenceRealtimeService
{
    private readonly IHubContext<PresenceHub, IPresenceClient> _hubContext;

    public SignalRPresenceRealtimeService(IHubContext<PresenceHub, IPresenceClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyPresenceChangedAsync(
        UserPresenceChangedDto presence,
        IReadOnlyCollection<Guid> audienceUserIds,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (audienceUserIds.Count == 0)
        {
            return Task.CompletedTask;
        }

        var groups = audienceUserIds
            .Where(userId => userId != Guid.Empty)
            .Select(PresenceHub.BuildUserGroupName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (groups.Count == 0)
        {
            return Task.CompletedTask;
        }

        return _hubContext.Clients.Groups(groups).PresenceChanged(presence);
    }
}


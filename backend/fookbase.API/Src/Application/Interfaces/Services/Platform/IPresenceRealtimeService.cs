using InteractHub.Api.Application.DTOs.Users;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IPresenceRealtimeService
{
    Task NotifyPresenceChangedAsync(
        UserPresenceChangedDto presence,
        IReadOnlyCollection<Guid> audienceUserIds,
        CancellationToken cancellationToken);
}


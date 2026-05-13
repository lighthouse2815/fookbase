using InteractHub.Api.Application.DTOs.Users;

namespace InteractHub.Api.Presentation.Hubs;

public interface IPresenceClient
{
    Task PresenceChanged(UserPresenceChangedDto payload);
}


using InteractHub.Api.Common.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Api.Presentation.Hubs;

[Authorize]
public class NotificationsHub : Hub<INotificationsClient>
{
    public static string BuildUserGroupName(Guid userId)
    {
        return $"notifications:{userId:D}";
    }

    public override async Task OnConnectedAsync()
    {
        var userId = ResolveUserId();
        if (userId.HasValue)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroupName(userId.Value));
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = ResolveUserId();
        if (userId.HasValue)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, BuildUserGroupName(userId.Value));
        }

        await base.OnDisconnectedAsync(exception);
    }

    private Guid? ResolveUserId()
    {
        if (Context.User.TryGetUserId(out var userId))
        {
            return userId;
        }

        return null;
    }
}




using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.Services.Games;

namespace InteractHub.Api.Tests.Services;

public class GameRoomServiceTests
{
    [Fact]
    public void CreateRoom_AndJoinRoomByCode_ShouldTrackPlayersAndHost()
    {
        var service = new GameRoomService();
        var host = new GamePlayerIdentityDto
        {
            UserId = Guid.NewGuid(),
            DisplayName = "Host",
            AvatarUrl = "https://example.com/host.png"
        };

        var createdRoom = service.CreateRoom(GameTypes.Caro, 2, host, connectionId: "conn-1");
        var guest = new GamePlayerIdentityDto
        {
            UserId = Guid.NewGuid(),
            DisplayName = "Guest",
            AvatarUrl = "https://example.com/guest.png"
        };

        var joinedRoom = service.JoinRoomByCode(createdRoom.RoomCode, guest, connectionId: "conn-2");

        Assert.Equal(createdRoom.RoomId, joinedRoom.RoomId);
        Assert.Equal(2, joinedRoom.Players.Count);
        Assert.Equal(host.UserId, joinedRoom.HostUserId);
        Assert.Contains(joinedRoom.Players, player => player.UserId == guest.UserId && player.IsConnected);
    }

    [Fact]
    public void JoinRoom_ShouldThrow_WhenRoomIsFull()
    {
        var service = new GameRoomService();

        var room = service.CreateRoom(
            GameTypes.Chess,
            2,
            new GamePlayerIdentityDto
            {
                UserId = Guid.NewGuid(),
                DisplayName = "A",
                AvatarUrl = "https://example.com/a.png"
            });

        service.JoinRoom(
            room.RoomId,
            new GamePlayerIdentityDto
            {
                UserId = Guid.NewGuid(),
                DisplayName = "B",
                AvatarUrl = "https://example.com/b.png"
            });

        Assert.Throws<InvalidOperationException>(() =>
            service.JoinRoom(
                room.RoomId,
                new GamePlayerIdentityDto
                {
                    UserId = Guid.NewGuid(),
                    DisplayName = "C",
                    AvatarUrl = "https://example.com/c.png"
                }));
    }

    [Fact]
    public void RegisterRematchVote_ShouldReturnAllPlayersReady_WhenBothPlayersVoted()
    {
        var service = new GameRoomService();
        var hostId = Guid.NewGuid();
        var guestId = Guid.NewGuid();

        var room = service.CreateRoom(
            GameTypes.Caro,
            2,
            new GamePlayerIdentityDto
            {
                UserId = hostId,
                DisplayName = "Host",
                AvatarUrl = "https://example.com/host.png"
            });

        service.JoinRoom(
            room.RoomId,
            new GamePlayerIdentityDto
            {
                UserId = guestId,
                DisplayName = "Guest",
                AvatarUrl = "https://example.com/guest.png"
            });

        service.MarkRoomPlaying(room.RoomId, hostId);
        service.MarkRoomFinished(room.RoomId);

        service.RegisterRematchVote(room.RoomId, hostId, out var hostAllReady);
        service.RegisterRematchVote(room.RoomId, guestId, out var guestAllReady);

        Assert.False(hostAllReady);
        Assert.True(guestAllReady);
    }
}


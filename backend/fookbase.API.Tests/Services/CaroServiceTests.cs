using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Caro;
using InteractHub.Api.Application.Services.Games;

namespace InteractHub.Api.Tests.Services;

public class CaroServiceTests
{
    private static GameRoomDto BuildRoom(Guid roomId, Guid xUserId, Guid oUserId)
    {
        return new GameRoomDto
        {
            RoomId = roomId,
            RoomCode = "ROOM01",
            GameType = GameTypes.Caro,
            HostUserId = xUserId,
            MaxPlayers = 2,
            Status = GameRoomStatuses.Playing,
            CreatedAt = DateTime.UtcNow,
            Players =
            [
                new GameRoomPlayerDto
                {
                    UserId = xUserId,
                    DisplayName = "Player X",
                    AvatarUrl = "https://example.com/x.png",
                    IsHost = true,
                    IsConnected = true,
                    JoinedAt = DateTime.UtcNow
                },
                new GameRoomPlayerDto
                {
                    UserId = oUserId,
                    DisplayName = "Player O",
                    AvatarUrl = "https://example.com/o.png",
                    IsHost = false,
                    IsConnected = true,
                    JoinedAt = DateTime.UtcNow
                }
            ]
        };
    }

    [Fact]
    public void SubmitMove_ShouldReject_WhenCellAlreadyOccupied()
    {
        var roomId = Guid.NewGuid();
        var xUserId = Guid.NewGuid();
        var oUserId = Guid.NewGuid();
        var service = new CaroService();

        service.StartGame(BuildRoom(roomId, xUserId, oUserId), 15);

        var firstMove = service.SubmitMove(xUserId, new CaroMoveInputDto
        {
            RoomId = roomId,
            Row = 7,
            Col = 7
        });

        var repeatedMove = service.SubmitMove(oUserId, new CaroMoveInputDto
        {
            RoomId = roomId,
            Row = 7,
            Col = 7
        });

        Assert.True(firstMove.Accepted);
        Assert.False(repeatedMove.Accepted);
    }

    [Fact]
    public void SubmitMove_ShouldReturnGameOver_WhenFiveInRowAchieved()
    {
        var roomId = Guid.NewGuid();
        var xUserId = Guid.NewGuid();
        var oUserId = Guid.NewGuid();
        var service = new CaroService();

        service.StartGame(BuildRoom(roomId, xUserId, oUserId), 15);

        var turns = new (Guid UserId, int Row, int Col)[]
        {
            (xUserId, 7, 3),
            (oUserId, 6, 3),
            (xUserId, 7, 4),
            (oUserId, 6, 4),
            (xUserId, 7, 5),
            (oUserId, 6, 5),
            (xUserId, 7, 6),
            (oUserId, 6, 6),
            (xUserId, 7, 7)
        };

        CaroMoveOutcomeDto? lastOutcome = null;
        foreach (var (userId, row, col) in turns)
        {
            lastOutcome = service.SubmitMove(userId, new CaroMoveInputDto
            {
                RoomId = roomId,
                Row = row,
                Col = col
            });
        }

        Assert.NotNull(lastOutcome);
        Assert.True(lastOutcome!.Accepted);
        Assert.NotNull(lastOutcome.GameOver);
        Assert.Equal(xUserId, lastOutcome.GameOver!.WinnerUserId);
        Assert.False(lastOutcome.GameOver.IsDraw);
    }

    [Fact]
    public void HandlePlayerDisconnect_ShouldDeclareOpponentWinner()
    {
        var roomId = Guid.NewGuid();
        var xUserId = Guid.NewGuid();
        var oUserId = Guid.NewGuid();
        var service = new CaroService();

        service.StartGame(BuildRoom(roomId, xUserId, oUserId), 15);
        var gameOver = service.HandlePlayerDisconnect(roomId, xUserId);

        Assert.NotNull(gameOver);
        Assert.Equal(oUserId, gameOver!.WinnerUserId);
        Assert.Equal("disconnect", gameOver.Reason);
    }
}

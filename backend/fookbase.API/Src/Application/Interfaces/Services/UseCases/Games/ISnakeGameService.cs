using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Snake;

namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface ISnakeGameService
{
    SnakeStateDto StartGame(GameRoomDto room);

    bool QueueInput(Guid userId, SnakeInputDto input);

    GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId);

    SnakeStateDto? GetState(Guid roomId);

    void RemoveRoom(Guid roomId);
}





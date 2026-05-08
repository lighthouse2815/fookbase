using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Flappy;

namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface IFlappyGameService
{
    FlappyStateDto StartGame(GameRoomDto room);

    bool QueueInput(Guid userId, FlappyInputDto input);

    GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId);

    FlappyStateDto? GetState(Guid roomId);

    void RemoveRoom(Guid roomId);
}

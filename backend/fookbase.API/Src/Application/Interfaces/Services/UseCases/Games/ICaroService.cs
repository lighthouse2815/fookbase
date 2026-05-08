using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Caro;

namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface ICaroService
{
    CaroStateDto StartGame(GameRoomDto room, int boardSize = 15);

    CaroMoveOutcomeDto SubmitMove(Guid userId, CaroMoveInputDto input);

    GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId);

    CaroStateDto? GetState(Guid roomId);

    void RemoveRoom(Guid roomId);
}


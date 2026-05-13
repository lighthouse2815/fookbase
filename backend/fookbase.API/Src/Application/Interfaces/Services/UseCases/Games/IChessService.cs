using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Chess;

namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface IChessService
{
    ChessStateDto StartGame(GameRoomDto room);

    ChessMoveOutcomeDto SubmitMove(Guid userId, ChessMoveInputDto input);

    GameOverDto Resign(Guid userId, ChessResignInputDto input);

    GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId);

    ChessStateDto? GetState(Guid roomId);

    void RemoveRoom(Guid roomId);
}





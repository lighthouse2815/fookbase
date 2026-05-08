using InteractHub.Api.Application.DTOs.Games;

namespace InteractHub.Api.Application.Interfaces.Services.Games;

public interface IGameRoomService
{
    IReadOnlyList<GameDefinitionDto> GetGameDefinitions();

    IReadOnlyList<GameRoomDto> GetRooms(string? gameType = null);

    GameRoomDto? GetRoom(Guid roomId);

    GameRoomDto? GetRoomByCode(string roomCode);

    GameRoomDto? GetActiveRoomForUser(Guid userId, string gameType);

    GameRoomDto CreateRoom(
        string gameType,
        int? maxPlayers,
        GamePlayerIdentityDto host,
        string? connectionId = null);

    GameRoomDto JoinRoomByCode(
        string roomCode,
        GamePlayerIdentityDto player,
        string? connectionId = null);

    GameRoomDto JoinRoom(
        Guid roomId,
        GamePlayerIdentityDto player,
        string? connectionId = null);

    GameRoomDto LeaveRoom(Guid roomId, Guid userId, bool isDisconnect);

    IReadOnlyList<GameRoomDto> HandleConnectionDisconnected(string connectionId);

    GameRoomDto MarkRoomPlaying(Guid roomId, Guid hostUserId);

    GameRoomDto MarkRoomFinished(Guid roomId);

    GameRoomDto RegisterRematchVote(Guid roomId, Guid userId, out bool allPlayersReady);

    GameRoomDto AcceptRematch(Guid roomId);

    void ClearRematchVotes(Guid roomId);
}


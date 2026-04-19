using System.Security.Claims;
using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Caro;
using InteractHub.Api.Application.DTOs.Games.Chess;
using InteractHub.Api.Application.DTOs.Games.Flappy;
using InteractHub.Api.Application.DTOs.Games.Snake;
using InteractHub.Api.Application.Interfaces.Services.Games;
using InteractHub.Api.Application.Services.Games;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Api.Presentation.Hubs;

[Authorize]
public class GamesHub : Hub
{
    private readonly IGameRoomService _gameRoomService;
    private readonly IChessService _chessService;
    private readonly ICaroService _caroService;
    private readonly ISnakeGameService _snakeGameService;
    private readonly IFlappyGameService _flappyGameService;
    private readonly ILogger<GamesHub> _logger;

    public GamesHub(
        IGameRoomService gameRoomService,
        IChessService chessService,
        ICaroService caroService,
        ISnakeGameService snakeGameService,
        IFlappyGameService flappyGameService,
        ILogger<GamesHub> logger)
    {
        _gameRoomService = gameRoomService;
        _chessService = chessService;
        _caroService = caroService;
        _snakeGameService = snakeGameService;
        _flappyGameService = flappyGameService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Lobby);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var disconnectedUserId = TryResolveCurrentUserId();
            var updatedRooms = _gameRoomService.HandleConnectionDisconnected(Context.ConnectionId);

            if (!disconnectedUserId.HasValue)
            {
                await base.OnDisconnectedAsync(exception);
                return;
            }

            foreach (var room in updatedRooms)
            {
                var currentRoom = room;
                var affectedPlayer = currentRoom.Players.FirstOrDefault(player => player.UserId == disconnectedUserId.Value);
                if (affectedPlayer is null || affectedPlayer.IsConnected)
                {
                    continue;
                }

                await Clients.Group(GameHubGroups.Room(currentRoom.RoomId)).SendAsync(
                    GameHubEventNames.PlayerLeft,
                    new PlayerPresenceChangedDto
                    {
                        RoomId = currentRoom.RoomId,
                        UserId = affectedPlayer.UserId,
                        DisplayName = affectedPlayer.DisplayName,
                        IsConnected = false,
                        IsDisconnectedEvent = true
                    });

                if (string.Equals(currentRoom.Status, GameRoomStatuses.Playing, StringComparison.OrdinalIgnoreCase))
                {
                    var disconnectGameOver = HandlePlayerDisconnect(currentRoom.GameType, currentRoom.RoomId, disconnectedUserId.Value);
                    if (disconnectGameOver is not null)
                    {
                        TryMarkRoomFinished(currentRoom.RoomId);
                        await Clients.Group(GameHubGroups.Room(currentRoom.RoomId)).SendAsync(GameHubEventNames.GameOver, disconnectGameOver);
                        currentRoom = _gameRoomService.GetRoom(currentRoom.RoomId) ?? currentRoom;
                    }
                }

                await BroadcastRoomUpdated(currentRoom);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup disconnected game connection {ConnectionId}.", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public Task JoinLobby()
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Lobby);
    }

    public async Task<GameRoomDto> CreateRoom(CreateRoomRequestDto request)
    {
        try
        {
            var currentUser = BuildCurrentUser(request.DisplayName, request.AvatarUrl);
            var room = _gameRoomService.CreateRoom(
                request.GameType,
                request.MaxPlayers,
                currentUser,
                Context.ConnectionId);

            await Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Room(room.RoomId));
            await Clients.Group(GameHubGroups.Lobby).SendAsync(GameHubEventNames.RoomCreated, room);
            await BroadcastRoomUpdated(room);
            return room;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    public async Task<GameRoomDto> JoinRoomByCode(JoinRoomByCodeRequestDto request)
    {
        try
        {
            var currentUser = BuildCurrentUser(request.DisplayName, request.AvatarUrl);
            var room = _gameRoomService.JoinRoomByCode(request.RoomCode, currentUser, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Room(room.RoomId));

            await Clients.Group(GameHubGroups.Room(room.RoomId)).SendAsync(
                GameHubEventNames.PlayerJoined,
                new PlayerPresenceChangedDto
                {
                    RoomId = room.RoomId,
                    UserId = currentUser.UserId,
                    DisplayName = currentUser.DisplayName,
                    IsConnected = true,
                    IsDisconnectedEvent = false
                });

            await BroadcastRoomUpdated(room);
            return room;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    public async Task<GameRoomDto> JoinRoom(JoinRoomRequestDto request)
    {
        try
        {
            var currentUser = BuildCurrentUser(request.DisplayName, request.AvatarUrl);
            var room = _gameRoomService.JoinRoom(request.RoomId, currentUser, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Room(room.RoomId));

            await Clients.Group(GameHubGroups.Room(room.RoomId)).SendAsync(
                GameHubEventNames.PlayerJoined,
                new PlayerPresenceChangedDto
                {
                    RoomId = room.RoomId,
                    UserId = currentUser.UserId,
                    DisplayName = currentUser.DisplayName,
                    IsConnected = true,
                    IsDisconnectedEvent = false
                });

            await BroadcastRoomUpdated(room);
            return room;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    public async Task<GameRoomDto> JoinRoomGroup(Guid roomId)
    {
        var room = _gameRoomService.GetRoom(roomId)
            ?? throw new HubException("Room not found.");

        var userId = ResolveCurrentUserId();
        if (room.Players.All(player => player.UserId != userId))
        {
            throw new HubException("You are not a player in this room.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GameHubGroups.Room(roomId));
        return room;
    }

    public async Task<GameRoomDto> LeaveRoom(LeaveRoomRequestDto request)
    {
        try
        {
            var userId = ResolveCurrentUserId();
            var previousRoom = _gameRoomService.GetRoom(request.RoomId);
            var updatedRoom = _gameRoomService.LeaveRoom(request.RoomId, userId, isDisconnect: false);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameHubGroups.Room(request.RoomId));

            await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(
                GameHubEventNames.PlayerLeft,
                new PlayerPresenceChangedDto
                {
                    RoomId = request.RoomId,
                    UserId = userId,
                    DisplayName = ResolveCurrentDisplayName(),
                    IsConnected = false,
                    IsDisconnectedEvent = false
                });

            if (updatedRoom.IsDeleted)
            {
                RemoveGameState(request.RoomId, previousRoom?.GameType);
            }
            else if (previousRoom is not null && string.Equals(previousRoom.Status, GameRoomStatuses.Playing, StringComparison.OrdinalIgnoreCase))
            {
                var gameOver = HandlePlayerDisconnect(previousRoom.GameType, request.RoomId, userId);
                if (gameOver is not null)
                {
                    TryMarkRoomFinished(request.RoomId);
                    await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(GameHubEventNames.GameOver, gameOver);
                    updatedRoom = _gameRoomService.GetRoom(request.RoomId) ?? updatedRoom;
                }
            }

            await BroadcastRoomUpdated(updatedRoom);
            return updatedRoom;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    public async Task<GameStartedDto> StartGame(StartGameRequestDto request)
    {
        try
        {
            var userId = ResolveCurrentUserId();
            var room = _gameRoomService.MarkRoomPlaying(request.RoomId, userId);
            var state = StartGameState(room);

            var startedPayload = new GameStartedDto
            {
                RoomId = room.RoomId,
                GameType = room.GameType,
                State = state,
                StartedAt = DateTime.UtcNow
            };

            await Clients.Group(GameHubGroups.Room(room.RoomId)).SendAsync(GameHubEventNames.GameStarted, startedPayload);
            await Clients.Group(GameHubGroups.Room(room.RoomId)).SendAsync(
                GameHubEventNames.GameStateUpdated,
                new GameStateUpdatedDto
                {
                    RoomId = room.RoomId,
                    GameType = room.GameType,
                    State = state
                });

            await BroadcastRoomUpdated(room);
            return startedPayload;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    public async Task<ChessMoveOutcomeDto> SubmitChessMove(ChessMoveInputDto input)
    {
        var userId = ResolveCurrentUserId();
        var outcome = _chessService.SubmitMove(userId, input);

        if (!outcome.Accepted || outcome.State is null)
        {
            await Clients.Caller.SendAsync(
                GameHubEventNames.MoveRejected,
                new MoveRejectedDto
                {
                    RoomId = input.RoomId,
                    GameType = GameTypes.Chess,
                    Reason = outcome.Error ?? "Move rejected."
                });
            return outcome;
        }

        await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(
            GameHubEventNames.MoveAccepted,
            new MoveAcceptedDto
            {
                RoomId = input.RoomId,
                GameType = GameTypes.Chess,
                UserId = userId,
                Message = "Move accepted.",
                Move = outcome.Move
            });

        await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(
            GameHubEventNames.GameStateUpdated,
            new GameStateUpdatedDto
            {
                RoomId = input.RoomId,
                GameType = GameTypes.Chess,
                State = outcome.State
            });

        if (outcome.GameOver is not null)
        {
            TryMarkRoomFinished(input.RoomId);
            await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(GameHubEventNames.GameOver, outcome.GameOver);
            var room = _gameRoomService.GetRoom(input.RoomId);
            if (room is not null)
            {
                await BroadcastRoomUpdated(room);
            }
        }

        return outcome;
    }

    public async Task<GameOverDto> ResignChess(ChessResignInputDto input)
    {
        var userId = ResolveCurrentUserId();
        var gameOver = _chessService.Resign(userId, input);
        TryMarkRoomFinished(input.RoomId);
        await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(GameHubEventNames.GameOver, gameOver);
        var room = _gameRoomService.GetRoom(input.RoomId);
        if (room is not null)
        {
            await BroadcastRoomUpdated(room);
        }

        return gameOver;
    }

    public async Task<CaroMoveOutcomeDto> SubmitCaroMove(CaroMoveInputDto input)
    {
        var userId = ResolveCurrentUserId();
        var outcome = _caroService.SubmitMove(userId, input);

        if (!outcome.Accepted || outcome.State is null)
        {
            await Clients.Caller.SendAsync(
                GameHubEventNames.MoveRejected,
                new MoveRejectedDto
                {
                    RoomId = input.RoomId,
                    GameType = GameTypes.Caro,
                    Reason = outcome.Error ?? "Move rejected."
                });
            return outcome;
        }

        await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(
            GameHubEventNames.MoveAccepted,
            new MoveAcceptedDto
            {
                RoomId = input.RoomId,
                GameType = GameTypes.Caro,
                UserId = userId,
                Message = "Move accepted.",
                Move = outcome.Move
            });

        await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(
            GameHubEventNames.GameStateUpdated,
            new GameStateUpdatedDto
            {
                RoomId = input.RoomId,
                GameType = GameTypes.Caro,
                State = outcome.State
            });

        if (outcome.GameOver is not null)
        {
            TryMarkRoomFinished(input.RoomId);
            await Clients.Group(GameHubGroups.Room(input.RoomId)).SendAsync(GameHubEventNames.GameOver, outcome.GameOver);
            var room = _gameRoomService.GetRoom(input.RoomId);
            if (room is not null)
            {
                await BroadcastRoomUpdated(room);
            }
        }

        return outcome;
    }

    public async Task<bool> SubmitSnakeInput(SnakeInputDto input)
    {
        var userId = ResolveCurrentUserId();
        var accepted = _snakeGameService.QueueInput(userId, input);
        if (!accepted)
        {
            await Clients.Caller.SendAsync(
                GameHubEventNames.MoveRejected,
                new MoveRejectedDto
                {
                    RoomId = input.RoomId,
                    GameType = GameTypes.SnakeDuo,
                    Reason = "Input rejected."
                });
        }

        return accepted;
    }

    public async Task<bool> SubmitFlappyInput(FlappyInputDto input)
    {
        var userId = ResolveCurrentUserId();
        var accepted = _flappyGameService.QueueInput(userId, input);
        if (!accepted)
        {
            await Clients.Caller.SendAsync(
                GameHubEventNames.MoveRejected,
                new MoveRejectedDto
                {
                    RoomId = input.RoomId,
                    GameType = GameTypes.FlappyDuo,
                    Reason = "Input rejected."
                });
        }

        return accepted;
    }

    public async Task<GameStartedDto?> RequestRematch(RematchRequestDto request)
    {
        return await HandleRematchVote(request);
    }

    public async Task<GameStartedDto?> AcceptRematch(RematchRequestDto request)
    {
        return await HandleRematchVote(request);
    }

    public object? GetCurrentGameState(Guid roomId)
    {
        var room = _gameRoomService.GetRoom(roomId);
        if (room is null)
        {
            return null;
        }

        return room.GameType switch
        {
            GameTypes.Chess => _chessService.GetState(roomId),
            GameTypes.Caro => _caroService.GetState(roomId),
            GameTypes.SnakeDuo => _snakeGameService.GetState(roomId),
            GameTypes.FlappyDuo => _flappyGameService.GetState(roomId),
            _ => null
        };
    }

    private async Task<GameStartedDto?> HandleRematchVote(RematchRequestDto request)
    {
        try
        {
            var userId = ResolveCurrentUserId();
            var room = _gameRoomService.RegisterRematchVote(request.RoomId, userId, out var allPlayersReady);

            await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(
                GameHubEventNames.RematchRequested,
                new
                {
                    roomId = request.RoomId,
                    userId
                });

            if (!allPlayersReady)
            {
                return null;
            }

            var waitingRoom = _gameRoomService.AcceptRematch(request.RoomId);
            var playingRoom = _gameRoomService.MarkRoomPlaying(waitingRoom.RoomId, waitingRoom.HostUserId);
            var state = StartGameState(playingRoom);

            var startedPayload = new GameStartedDto
            {
                RoomId = playingRoom.RoomId,
                GameType = playingRoom.GameType,
                State = state,
                StartedAt = DateTime.UtcNow
            };

            await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(GameHubEventNames.RematchAccepted, new
            {
                roomId = request.RoomId
            });
            await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(GameHubEventNames.GameStarted, startedPayload);
            await Clients.Group(GameHubGroups.Room(request.RoomId)).SendAsync(
                GameHubEventNames.GameStateUpdated,
                new GameStateUpdatedDto
                {
                    RoomId = request.RoomId,
                    GameType = playingRoom.GameType,
                    State = state
                });

            await BroadcastRoomUpdated(playingRoom);
            return startedPayload;
        }
        catch (HubException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw CreateHubException(exception);
        }
    }

    private object StartGameState(GameRoomDto room)
    {
        return room.GameType switch
        {
            GameTypes.Chess => _chessService.StartGame(room),
            GameTypes.Caro => _caroService.StartGame(room, 15),
            GameTypes.SnakeDuo => _snakeGameService.StartGame(room),
            GameTypes.FlappyDuo => _flappyGameService.StartGame(room),
            _ => throw new InvalidOperationException("Unsupported game type.")
        };
    }

    private GameOverDto? HandlePlayerDisconnect(string gameType, Guid roomId, Guid disconnectedUserId)
    {
        return gameType switch
        {
            GameTypes.Chess => _chessService.HandlePlayerDisconnect(roomId, disconnectedUserId),
            GameTypes.Caro => _caroService.HandlePlayerDisconnect(roomId, disconnectedUserId),
            GameTypes.SnakeDuo => _snakeGameService.HandlePlayerDisconnect(roomId, disconnectedUserId),
            GameTypes.FlappyDuo => _flappyGameService.HandlePlayerDisconnect(roomId, disconnectedUserId),
            _ => null
        };
    }

    private void RemoveGameState(Guid roomId, string? gameType)
    {
        switch (gameType)
        {
            case GameTypes.Chess:
                _chessService.RemoveRoom(roomId);
                break;
            case GameTypes.Caro:
                _caroService.RemoveRoom(roomId);
                break;
            case GameTypes.SnakeDuo:
                _snakeGameService.RemoveRoom(roomId);
                break;
            case GameTypes.FlappyDuo:
                _flappyGameService.RemoveRoom(roomId);
                break;
            default:
                _chessService.RemoveRoom(roomId);
                _caroService.RemoveRoom(roomId);
                _snakeGameService.RemoveRoom(roomId);
                _flappyGameService.RemoveRoom(roomId);
                break;
        }
    }

    private async Task BroadcastRoomUpdated(GameRoomDto room)
    {
        await Clients.Group(GameHubGroups.Lobby).SendAsync(GameHubEventNames.RoomUpdated, room);
        await Clients.Group(GameHubGroups.Room(room.RoomId)).SendAsync(GameHubEventNames.RoomUpdated, room);
    }

    private static HubException CreateHubException(Exception exception)
    {
        return new HubException(exception is InvalidOperationException or ArgumentException
            ? exception.Message
            : "Unexpected game hub error.");
    }

    private Guid ResolveCurrentUserId()
    {
        var userId = TryResolveCurrentUserId();
        if (!userId.HasValue)
        {
            throw new HubException("Unauthorized.");
        }

        return userId.Value;
    }

    private Guid? TryResolveCurrentUserId()
    {
        var rawUserId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("sub");

        return Guid.TryParse(rawUserId, out var parsedUserId) ? parsedUserId : null;
    }

    private string ResolveCurrentDisplayName()
    {
        var claimCandidates = new[]
        {
            "username",
            ClaimTypes.Name,
            "preferred_username",
            "unique_name",
            "name"
        };

        foreach (var claim in claimCandidates)
        {
            var value = Context.User?.FindFirstValue(claim);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        var fallbackUserId = ResolveCurrentUserId();
        return $"player_{fallbackUserId.ToString("N")[..6]}";
    }

    private GamePlayerIdentityDto BuildCurrentUser(string? displayName, string? avatarUrl)
    {
        var userId = ResolveCurrentUserId();
        return new GamePlayerIdentityDto
        {
            UserId = userId,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? ResolveCurrentDisplayName() : displayName.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl)
                ? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
                : avatarUrl.Trim()
        };
    }

    private void TryMarkRoomFinished(Guid roomId)
    {
        try
        {
            _gameRoomService.MarkRoomFinished(roomId);
        }
        catch (Exception exception)
        {
            _logger.LogDebug(exception, "Skip mark-finished for room {RoomId}.", roomId);
        }
    }
}

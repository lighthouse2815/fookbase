using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.Interfaces.Services.Games;
using InteractHub.Api.Application.Services.Games;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/games")]
[Authorize]
public sealed class GamesController : ApiControllerBase
{
    private readonly IGameRoomService _gameRoomService;
    private readonly IGameRealtimeService _gameRealtimeService;

    public GamesController(
        IGameRoomService gameRoomService,
        IGameRealtimeService gameRealtimeService)
    {
        _gameRoomService = gameRoomService;
        _gameRealtimeService = gameRealtimeService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyList<GameDefinitionDto>>> GetGames()
    {
        return Ok(ApiResponse<IReadOnlyList<GameDefinitionDto>>.Ok(_gameRoomService.GetGameDefinitions()));
    }

    [HttpGet("rooms")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<IReadOnlyList<GameRoomDto>>> GetRooms([FromQuery] string? gameType = null)
    {
        return Ok(ApiResponse<IReadOnlyList<GameRoomDto>>.Ok(_gameRoomService.GetRooms(gameType)));
    }

    [HttpGet("rooms/{roomId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ApiResponse<GameRoomDto>> GetRoom(Guid roomId)
    {
        var room = _gameRoomService.GetRoom(roomId);
        if (room is null)
        {
            return NotFound(ApiResponse<GameRoomDto>.Fail("Room not found."));
        }

        return Ok(ApiResponse<GameRoomDto>.Ok(room));
    }

    [HttpGet("rooms/by-code/{roomCode}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ApiResponse<GameRoomDto>> GetRoomByCode(string roomCode)
    {
        var room = _gameRoomService.GetRoomByCode(roomCode);
        if (room is null)
        {
            return NotFound(ApiResponse<GameRoomDto>.Fail("Room not found."));
        }

        return Ok(ApiResponse<GameRoomDto>.Ok(room));
    }

    [HttpGet("rooms/active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<GameRoomDto?>> GetActiveRoom([FromQuery] string gameType)
    {
        var room = _gameRoomService.GetActiveRoomForUser(GetCurrentUserId(), gameType);
        return Ok(ApiResponse<GameRoomDto?>.Ok(room));
    }

    [HttpPost("rooms")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<GameRoomDto>>> CreateRoom(
        [FromBody] CreateRoomRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var room = _gameRoomService.CreateRoom(
                request.GameType,
                request.MaxPlayers,
                BuildCurrentPlayer(request.DisplayName, request.AvatarUrl));

            await _gameRealtimeService.BroadcastToLobbyAsync(GameHubEventNames.RoomCreated, room, cancellationToken);
            await _gameRealtimeService.BroadcastToLobbyAsync(GameHubEventNames.RoomUpdated, room, cancellationToken);

            return CreatedAtAction(nameof(GetRoom), new { roomId = room.RoomId }, ApiResponse<GameRoomDto>.Ok(room));
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ApiResponse<GameRoomDto>.Fail(exception.Message));
        }
    }

    [HttpPost("rooms/join-by-code")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<GameRoomDto>>> JoinRoomByCode(
        [FromBody] JoinRoomByCodeRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var player = BuildCurrentPlayer(request.DisplayName, request.AvatarUrl);
            var room = _gameRoomService.JoinRoomByCode(request.RoomCode, player);

            await _gameRealtimeService.BroadcastToRoomAsync(
                room.RoomId,
                GameHubEventNames.PlayerJoined,
                new PlayerPresenceChangedDto
                {
                    RoomId = room.RoomId,
                    UserId = player.UserId,
                    DisplayName = player.DisplayName,
                    IsConnected = true,
                    IsDisconnectedEvent = false
                },
                cancellationToken);

            await _gameRealtimeService.BroadcastToLobbyAsync(GameHubEventNames.RoomUpdated, room, cancellationToken);
            await _gameRealtimeService.BroadcastToRoomAsync(room.RoomId, GameHubEventNames.RoomUpdated, room, cancellationToken);
            return Ok(ApiResponse<GameRoomDto>.Ok(room));
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ApiResponse<GameRoomDto>.Fail(exception.Message));
        }
    }

    [HttpPost("rooms/join")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<GameRoomDto>>> JoinRoom(
        [FromBody] JoinRoomRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var player = BuildCurrentPlayer(request.DisplayName, request.AvatarUrl);
            var room = _gameRoomService.JoinRoom(request.RoomId, player);

            await _gameRealtimeService.BroadcastToRoomAsync(
                room.RoomId,
                GameHubEventNames.PlayerJoined,
                new PlayerPresenceChangedDto
                {
                    RoomId = room.RoomId,
                    UserId = player.UserId,
                    DisplayName = player.DisplayName,
                    IsConnected = true,
                    IsDisconnectedEvent = false
                },
                cancellationToken);

            await _gameRealtimeService.BroadcastToLobbyAsync(GameHubEventNames.RoomUpdated, room, cancellationToken);
            await _gameRealtimeService.BroadcastToRoomAsync(room.RoomId, GameHubEventNames.RoomUpdated, room, cancellationToken);
            return Ok(ApiResponse<GameRoomDto>.Ok(room));
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ApiResponse<GameRoomDto>.Fail(exception.Message));
        }
    }

    [HttpPost("rooms/leave")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<GameRoomDto>>> LeaveRoom(
        [FromBody] LeaveRoomRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetCurrentUserId();
            var room = _gameRoomService.LeaveRoom(request.RoomId, userId, isDisconnect: false);

            await _gameRealtimeService.BroadcastToRoomAsync(
                request.RoomId,
                GameHubEventNames.PlayerLeft,
                new PlayerPresenceChangedDto
                {
                    RoomId = request.RoomId,
                    UserId = userId,
                    DisplayName = ResolveDisplayName(),
                    IsConnected = false,
                    IsDisconnectedEvent = false
                },
                cancellationToken);

            await _gameRealtimeService.BroadcastToLobbyAsync(GameHubEventNames.RoomUpdated, room, cancellationToken);
            await _gameRealtimeService.BroadcastToRoomAsync(request.RoomId, GameHubEventNames.RoomUpdated, room, cancellationToken);
            return Ok(ApiResponse<GameRoomDto>.Ok(room));
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ApiResponse<GameRoomDto>.Fail(exception.Message));
        }
    }

    private GamePlayerIdentityDto BuildCurrentPlayer(string? displayName, string? avatarUrl)
    {
        var userId = GetCurrentUserId();
        return new GamePlayerIdentityDto
        {
            UserId = userId,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? ResolveDisplayName() : displayName.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl)
                ? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
                : avatarUrl.Trim()
        };
    }

    private string ResolveDisplayName()
    {
        var fromClaims = User.GetUsernameOrNull();
        if (!string.IsNullOrWhiteSpace(fromClaims))
        {
            return fromClaims;
        }

        var userId = GetCurrentUserId();
        return $"player_{userId.ToString("N")[..6]}";
    }
}

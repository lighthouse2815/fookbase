using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.Interfaces.Services.Games;

namespace InteractHub.Api.Application.Services.Games;

public sealed class GameRoomService : IGameRoomService
{
    private const string RoomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static readonly IReadOnlyList<GameDefinitionDto> Definitions =
    [
        new GameDefinitionDto
        {
            GameType = GameTypes.Chess,
            Name = "Chess",
            Description = "Classic 1v1 chess with server-side move validation.",
            RoutePath = "/games/chess",
            MaxPlayers = 2
        },
        new GameDefinitionDto
        {
            GameType = GameTypes.Caro,
            Name = "Caro",
            Description = "Five in a row on a 15x15 board.",
            RoutePath = "/games/caro",
            MaxPlayers = 2
        },
        new GameDefinitionDto
        {
            GameType = GameTypes.SnakeDuo,
            Name = "Snake Duo",
            Description = "Two snakes share one map with realtime server ticks.",
            RoutePath = "/games/snake-duo",
            MaxPlayers = 2
        },
        new GameDefinitionDto
        {
            GameType = GameTypes.FlappyDuo,
            Name = "Flappy Duo",
            Description = "Two birds fly together, with ghost-style opponent view.",
            RoutePath = "/games/flappy-duo",
            MaxPlayers = 2
        }
    ];

    private readonly object _syncRoot = new();
    private readonly Dictionary<Guid, RoomState> _rooms = new();
    private readonly Dictionary<string, Guid> _roomCodeIndex = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<GameDefinitionDto> GetGameDefinitions()
    {
        return Definitions;
    }

    public IReadOnlyList<GameRoomDto> GetRooms(string? gameType = null)
    {
        lock (_syncRoot)
        {
            var normalizedGameType = string.IsNullOrWhiteSpace(gameType)
                ? null
                : GameTypes.Normalize(gameType);

            return _rooms.Values
                .Where(room => !room.IsDeleted)
                .Where(room => room.Players.Count > 0)
                .Where(room => normalizedGameType is null || string.Equals(room.GameType, normalizedGameType, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(room => room.CreatedAt)
                .Select(ToDto)
                .ToList();
        }
    }

    public GameRoomDto? GetRoom(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                return null;
            }

            return ToDto(room);
        }
    }

    public GameRoomDto? GetRoomByCode(string roomCode)
    {
        if (string.IsNullOrWhiteSpace(roomCode))
        {
            return null;
        }

        lock (_syncRoot)
        {
            if (!_roomCodeIndex.TryGetValue(roomCode.Trim(), out var roomId))
            {
                return null;
            }

            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                return null;
            }

            return ToDto(room);
        }
    }

    public GameRoomDto? GetActiveRoomForUser(Guid userId, string gameType)
    {
        var normalizedGameType = GameTypes.Normalize(gameType);

        lock (_syncRoot)
        {
            var activeRoom = _rooms.Values
                .Where(room => !room.IsDeleted)
                .Where(room => string.Equals(room.GameType, normalizedGameType, StringComparison.OrdinalIgnoreCase))
                .Where(room => room.Players.Any(player => player.UserId == userId))
                .OrderByDescending(room => string.Equals(room.Status, GameRoomStatuses.Playing, StringComparison.OrdinalIgnoreCase))
                .ThenByDescending(room => room.CreatedAt)
                .FirstOrDefault();

            return activeRoom is null ? null : ToDto(activeRoom);
        }
    }

    public GameRoomDto CreateRoom(string gameType, int? maxPlayers, GamePlayerIdentityDto host, string? connectionId = null)
    {
        var normalizedGameType = GameTypes.Normalize(gameType);

        lock (_syncRoot)
        {
            var resolvedMaxPlayers = ResolveMaxPlayers(normalizedGameType, maxPlayers);
            var room = new RoomState
            {
                RoomId = Guid.NewGuid(),
                RoomCode = GenerateUniqueRoomCode(),
                GameType = normalizedGameType,
                HostUserId = host.UserId,
                MaxPlayers = resolvedMaxPlayers,
                Status = GameRoomStatuses.Waiting,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
                Players =
                [
                    new RoomPlayerState
                    {
                        UserId = host.UserId,
                        DisplayName = NormalizeDisplayName(host.DisplayName, host.UserId),
                        AvatarUrl = NormalizeAvatarUrl(host.AvatarUrl, host.UserId),
                        IsConnected = true,
                        ConnectionId = connectionId?.Trim(),
                        JoinedAt = DateTime.UtcNow
                    }
                ]
            };

            _rooms[room.RoomId] = room;
            _roomCodeIndex[room.RoomCode] = room.RoomId;

            return ToDto(room);
        }
    }

    public GameRoomDto JoinRoomByCode(string roomCode, GamePlayerIdentityDto player, string? connectionId = null)
    {
        if (string.IsNullOrWhiteSpace(roomCode))
        {
            throw new InvalidOperationException("roomCode is required.");
        }

        lock (_syncRoot)
        {
            if (!_roomCodeIndex.TryGetValue(roomCode.Trim(), out var roomId))
            {
                throw new InvalidOperationException("Room not found.");
            }

            return JoinRoomCore(roomId, player, connectionId);
        }
    }

    public GameRoomDto JoinRoom(Guid roomId, GamePlayerIdentityDto player, string? connectionId = null)
    {
        lock (_syncRoot)
        {
            return JoinRoomCore(roomId, player, connectionId);
        }
    }

    public GameRoomDto LeaveRoom(Guid roomId, Guid userId, bool isDisconnect)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                throw new InvalidOperationException("Room not found.");
            }

            var player = room.Players.FirstOrDefault(item => item.UserId == userId);
            if (player is null)
            {
                return ToDto(room);
            }

            room.RematchVotes.Remove(userId);

            if (isDisconnect)
            {
                player.IsConnected = false;
                player.ConnectionId = null;
            }
            else
            {
                room.Players.Remove(player);
            }

            if (room.Players.Count == 0)
            {
                room.IsDeleted = true;
                room.Status = GameRoomStatuses.Finished;
                _roomCodeIndex.Remove(room.RoomCode);
                _rooms.Remove(room.RoomId);
                return BuildDeletedDto(room);
            }

            if (!room.Players.Any(item => item.UserId == room.HostUserId))
            {
                room.HostUserId = room.Players[0].UserId;
            }

            if (room.Players.Count < 2 && string.Equals(room.Status, GameRoomStatuses.Playing, StringComparison.OrdinalIgnoreCase))
            {
                room.Status = GameRoomStatuses.Finished;
            }

            return ToDto(room);
        }
    }

    public IReadOnlyList<GameRoomDto> HandleConnectionDisconnected(string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
        {
            return Array.Empty<GameRoomDto>();
        }

        lock (_syncRoot)
        {
            var updatedRooms = new HashSet<Guid>();

            foreach (var room in _rooms.Values.Where(item => !item.IsDeleted))
            {
                foreach (var player in room.Players.Where(item => string.Equals(item.ConnectionId, connectionId, StringComparison.Ordinal)))
                {
                    if (!player.IsConnected)
                    {
                        continue;
                    }

                    player.IsConnected = false;
                    player.ConnectionId = null;
                    updatedRooms.Add(room.RoomId);
                }
            }

            return updatedRooms
                .Select(roomId => _rooms.TryGetValue(roomId, out var room) ? ToDto(room) : null)
                .Where(room => room is not null)
                .Cast<GameRoomDto>()
                .ToList();
        }
    }

    public GameRoomDto MarkRoomPlaying(Guid roomId, Guid hostUserId)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                throw new InvalidOperationException("Room not found.");
            }

            if (room.HostUserId != hostUserId)
            {
                throw new InvalidOperationException("Only host can start the game.");
            }

            if (room.Players.Count < room.MaxPlayers)
            {
                throw new InvalidOperationException("Not enough players to start.");
            }

            room.Status = GameRoomStatuses.Playing;
            room.RematchVotes.Clear();
            return ToDto(room);
        }
    }

    public GameRoomDto MarkRoomFinished(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                throw new InvalidOperationException("Room not found.");
            }

            room.Status = GameRoomStatuses.Finished;
            return ToDto(room);
        }
    }

    public GameRoomDto RegisterRematchVote(Guid roomId, Guid userId, out bool allPlayersReady)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                throw new InvalidOperationException("Room not found.");
            }

            if (!string.Equals(room.Status, GameRoomStatuses.Finished, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Rematch can only be requested after game over.");
            }

            if (room.Players.All(item => item.UserId != userId))
            {
                throw new InvalidOperationException("Player is not in room.");
            }

            room.RematchVotes.Add(userId);
            allPlayersReady = room.Players.Count >= 2 && room.RematchVotes.Count == room.Players.Count;

            return ToDto(room);
        }
    }

    public GameRoomDto AcceptRematch(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
            {
                throw new InvalidOperationException("Room not found.");
            }

            room.Status = GameRoomStatuses.Waiting;
            room.RematchVotes.Clear();
            return ToDto(room);
        }
    }

    public void ClearRematchVotes(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (_rooms.TryGetValue(roomId, out var room))
            {
                room.RematchVotes.Clear();
            }
        }
    }

    private GameRoomDto JoinRoomCore(Guid roomId, GamePlayerIdentityDto player, string? connectionId)
    {
        if (!_rooms.TryGetValue(roomId, out var room) || room.IsDeleted)
        {
            throw new InvalidOperationException("Room not found.");
        }

        var existingPlayer = room.Players.FirstOrDefault(item => item.UserId == player.UserId);
        if (existingPlayer is not null)
        {
            existingPlayer.DisplayName = NormalizeDisplayName(player.DisplayName, player.UserId);
            existingPlayer.AvatarUrl = NormalizeAvatarUrl(player.AvatarUrl, player.UserId);
            existingPlayer.IsConnected = true;
            existingPlayer.ConnectionId = connectionId?.Trim();
            return ToDto(room);
        }

        if (string.Equals(room.Status, GameRoomStatuses.Playing, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Room is already playing.");
        }

        if (room.Players.Count >= room.MaxPlayers)
        {
            throw new InvalidOperationException("Room is full.");
        }

        room.Players.Add(new RoomPlayerState
        {
            UserId = player.UserId,
            DisplayName = NormalizeDisplayName(player.DisplayName, player.UserId),
            AvatarUrl = NormalizeAvatarUrl(player.AvatarUrl, player.UserId),
            IsConnected = true,
            ConnectionId = connectionId?.Trim(),
            JoinedAt = DateTime.UtcNow
        });

        room.RematchVotes.Clear();
        return ToDto(room);
    }

    private int ResolveMaxPlayers(string gameType, int? maxPlayers)
    {
        // Current games are all 1v1 by design.
        if (string.Equals(gameType, GameTypes.Chess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(gameType, GameTypes.Caro, StringComparison.OrdinalIgnoreCase)
            || string.Equals(gameType, GameTypes.SnakeDuo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(gameType, GameTypes.FlappyDuo, StringComparison.OrdinalIgnoreCase))
        {
            return 2;
        }

        return maxPlayers is > 1 ? maxPlayers.Value : 2;
    }

    private string GenerateUniqueRoomCode()
    {
        for (var attempt = 0; attempt < 100; attempt++)
        {
            var codeChars = new char[6];
            for (var index = 0; index < codeChars.Length; index++)
            {
                var randomIndex = Random.Shared.Next(0, RoomCodeAlphabet.Length);
                codeChars[index] = RoomCodeAlphabet[randomIndex];
            }

            var code = new string(codeChars);
            if (!_roomCodeIndex.ContainsKey(code))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Cannot allocate room code.");
    }

    private static string NormalizeDisplayName(string? displayName, Guid userId)
    {
        if (!string.IsNullOrWhiteSpace(displayName))
        {
            return displayName.Trim();
        }

        return $"player_{userId.ToString("N")[..6]}";
    }

    private static string NormalizeAvatarUrl(string? avatarUrl, Guid userId)
    {
        if (!string.IsNullOrWhiteSpace(avatarUrl))
        {
            return avatarUrl.Trim();
        }

        return $"https://i.pravatar.cc/150?u={userId:D}";
    }

    private static GameRoomDto ToDto(RoomState room)
    {
        return new GameRoomDto
        {
            RoomId = room.RoomId,
            RoomCode = room.RoomCode,
            GameType = room.GameType,
            HostUserId = room.HostUserId,
            MaxPlayers = room.MaxPlayers,
            Status = room.Status,
            CreatedAt = room.CreatedAt,
            IsDeleted = room.IsDeleted,
            Players = room.Players
                .OrderBy(player => player.JoinedAt)
                .Select(player => new GameRoomPlayerDto
                {
                    UserId = player.UserId,
                    DisplayName = player.DisplayName,
                    AvatarUrl = player.AvatarUrl,
                    IsHost = player.UserId == room.HostUserId,
                    IsConnected = player.IsConnected,
                    JoinedAt = player.JoinedAt
                })
                .ToList()
        };
    }

    private static GameRoomDto BuildDeletedDto(RoomState room)
    {
        return new GameRoomDto
        {
            RoomId = room.RoomId,
            RoomCode = room.RoomCode,
            GameType = room.GameType,
            HostUserId = room.HostUserId,
            MaxPlayers = room.MaxPlayers,
            Status = GameRoomStatuses.Finished,
            CreatedAt = room.CreatedAt,
            IsDeleted = true,
            Players = Array.Empty<GameRoomPlayerDto>()
        };
    }

    private sealed class RoomState
    {
        public Guid RoomId { get; init; }

        public required string RoomCode { get; init; }

        public required string GameType { get; init; }

        public Guid HostUserId { get; set; }

        public int MaxPlayers { get; init; }

        public required string Status { get; set; }

        public DateTime CreatedAt { get; init; }

        public bool IsDeleted { get; set; }

        public List<RoomPlayerState> Players { get; init; } = [];

        public HashSet<Guid> RematchVotes { get; } = [];
    }

    private sealed class RoomPlayerState
    {
        public Guid UserId { get; init; }

        public required string DisplayName { get; set; }

        public required string AvatarUrl { get; set; }

        public bool IsConnected { get; set; }

        public string? ConnectionId { get; set; }

        public DateTime JoinedAt { get; init; }
    }
}

using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using System.Collections.Concurrent;
using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Snake;
using InteractHub.Api.Application.Interfaces.Services.Games;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services.Games;

public sealed class SnakeGameService : ISnakeGameService
{
    private const int TickRate = 10;
    private const int TickIntervalMs = 1000 / TickRate;
    private const int BoardWidth = 28;
    private const int BoardHeight = 20;
    private const bool IsWallFatal = true;

    private readonly ConcurrentDictionary<Guid, SnakeMatchSession> _sessions = new();
    private readonly IGameRealtimeService _realtimeService;
    private readonly IGameRoomService _gameRoomService;
    private readonly ILogger<SnakeGameService> _logger;

    public SnakeGameService(
        IGameRealtimeService realtimeService,
        IGameRoomService gameRoomService,
        ILogger<SnakeGameService> logger)
    {
        _realtimeService = realtimeService;
        _gameRoomService = gameRoomService;
        _logger = logger;
    }

    public SnakeStateDto StartGame(GameRoomDto room)
    {
        if (room.Players.Count < 2)
        {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION, "Snake Duo requires 2 players.");
        }

        RemoveRoom(room.RoomId);

        var players = room.Players
            .OrderBy(player => player.JoinedAt)
            .Take(2)
            .ToList();

        var session = BuildSession(room.RoomId, players);
        _sessions[room.RoomId] = session;
        _ = RunLoopAsync(session);
        return ToDto(session);
    }

    public bool QueueInput(Guid userId, SnakeInputDto input)
    {
        if (!_sessions.TryGetValue(input.RoomId, out var session))
        {
            return false;
        }

        lock (session.SyncRoot)
        {
            if (!TryParseDirection(input.Direction, out var nextDirection))
            {
                return false;
            }

            if (!session.Players.TryGetValue(userId, out var player) || !player.IsAlive)
            {
                return false;
            }

            if (IsOpposite(player.Direction, nextDirection))
            {
                return false;
            }

            if (player.PendingDirection == nextDirection)
            {
                return false;
            }

            player.PendingDirection = nextDirection;
            return true;
        }
    }

    public GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId)
    {
        if (!_sessions.TryGetValue(roomId, out var session))
        {
            return null;
        }

        lock (session.SyncRoot)
        {
            if (string.Equals(session.Phase, "finished", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            if (!session.Players.TryGetValue(disconnectedUserId, out var player))
            {
                return null;
            }

            player.IsAlive = false;
            session.Phase = "finished";
            session.EndReason = "disconnect";

            var alivePlayers = session.Players.Values.Where(item => item.IsAlive).ToList();
            if (alivePlayers.Count == 1)
            {
                session.WinnerUserId = alivePlayers[0].UserId;
                session.IsDraw = false;
            }
            else
            {
                session.WinnerUserId = null;
                session.IsDraw = true;
            }

            return BuildGameOver(session);
        }
    }

    public SnakeStateDto? GetState(Guid roomId)
    {
        if (!_sessions.TryGetValue(roomId, out var session))
        {
            return null;
        }

        lock (session.SyncRoot)
        {
            return ToDto(session);
        }
    }

    public void RemoveRoom(Guid roomId)
    {
        if (_sessions.TryRemove(roomId, out var session))
        {
            session.CancellationTokenSource.Cancel();
            session.CancellationTokenSource.Dispose();
        }
    }

    private async Task RunLoopAsync(SnakeMatchSession session)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(TickIntervalMs));
        try
        {
            while (await timer.WaitForNextTickAsync(session.CancellationTokenSource.Token))
            {
                GameOverDto? gameOver = null;
                SnakeStateDto snapshot;

                lock (session.SyncRoot)
                {
                    session.Tick++;

                    if (string.Equals(session.Phase, "countdown", StringComparison.OrdinalIgnoreCase))
                    {
                        if (session.Tick % TickRate == 0)
                        {
                            session.Countdown--;
                            if (session.Countdown <= 0)
                            {
                                session.Countdown = 0;
                                session.Phase = "playing";
                            }
                        }
                    }
                    else if (string.Equals(session.Phase, "playing", StringComparison.OrdinalIgnoreCase))
                    {
                        AdvancePlayingTick(session);
                        if (string.Equals(session.Phase, "finished", StringComparison.OrdinalIgnoreCase))
                        {
                            gameOver = BuildGameOver(session);
                        }
                    }

                    snapshot = ToDto(session);
                }

                await _realtimeService.BroadcastToRoomAsync(
                    session.RoomId,
                    GameHubEventNames.GameStateUpdated,
                    new GameStateUpdatedDto
                    {
                        RoomId = session.RoomId,
                        GameType = GameTypes.SnakeDuo,
                        State = snapshot
                    },
                    session.CancellationTokenSource.Token);

                if (gameOver is null)
                {
                    continue;
                }

                TryMarkRoomFinished(session.RoomId);
                await _realtimeService.BroadcastToRoomAsync(
                    session.RoomId,
                    GameHubEventNames.GameOver,
                    gameOver,
                    session.CancellationTokenSource.Token);
                break;
            }
        }
        catch (OperationCanceledException)
        {
            // Session was cancelled.
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Snake session loop crashed for room {RoomId}.", session.RoomId);
        }
    }

    private static SnakeMatchSession BuildSession(Guid roomId, IReadOnlyList<GameRoomPlayerDto> players)
    {
        var firstPlayer = players[0];
        var secondPlayer = players[1];

        var firstSnake = new SnakePlayerRuntime
        {
            UserId = firstPlayer.UserId,
            DisplayName = firstPlayer.DisplayName,
            AvatarUrl = firstPlayer.AvatarUrl,
            Color = "#16a34a",
            Direction = SnakeDirection.Right,
            PendingDirection = SnakeDirection.Right,
            Segments =
            [
                new GridPoint(6, BoardHeight / 2),
                new GridPoint(5, BoardHeight / 2),
                new GridPoint(4, BoardHeight / 2)
            ]
        };

        var secondSnake = new SnakePlayerRuntime
        {
            UserId = secondPlayer.UserId,
            DisplayName = secondPlayer.DisplayName,
            AvatarUrl = secondPlayer.AvatarUrl,
            Color = "#ef4444",
            Direction = SnakeDirection.Left,
            PendingDirection = SnakeDirection.Left,
            Segments =
            [
                new GridPoint(BoardWidth - 7, BoardHeight / 2),
                new GridPoint(BoardWidth - 6, BoardHeight / 2),
                new GridPoint(BoardWidth - 5, BoardHeight / 2)
            ]
        };

        var session = new SnakeMatchSession
        {
            RoomId = roomId,
            Phase = "countdown",
            Countdown = 3,
            Tick = 0,
            Width = BoardWidth,
            Height = BoardHeight,
            IsWallFatal = IsWallFatal
        };

        session.Players[firstSnake.UserId] = firstSnake;
        session.Players[secondSnake.UserId] = secondSnake;
        session.Fruit = SpawnFruit(session);

        return session;
    }

    private static void AdvancePlayingTick(SnakeMatchSession session)
    {
        var alivePlayers = session.Players.Values.Where(player => player.IsAlive).ToList();
        if (alivePlayers.Count == 0)
        {
            session.Phase = "finished";
            session.IsDraw = true;
            session.EndReason = "all-dead";
            return;
        }

        var nextHeads = new Dictionary<Guid, GridPoint>();
        var growthMap = new Dictionary<Guid, bool>();
        var deadPlayers = new HashSet<Guid>();

        foreach (var player in alivePlayers)
        {
            if (!IsOpposite(player.Direction, player.PendingDirection))
            {
                player.Direction = player.PendingDirection;
            }

            var currentHead = player.Segments[0];
            var nextHead = Move(currentHead, player.Direction);

            if (session.IsWallFatal && !IsInsideBoard(nextHead, session.Width, session.Height))
            {
                deadPlayers.Add(player.UserId);
                continue;
            }

            if (!session.IsWallFatal)
            {
                nextHead = Wrap(nextHead, session.Width, session.Height);
            }

            nextHeads[player.UserId] = nextHead;
            growthMap[player.UserId] = nextHead.Equals(session.Fruit);
        }

        if (nextHeads.Count == 2)
        {
            var first = nextHeads.First();
            var second = nextHeads.Last();
            if (first.Value.Equals(second.Value))
            {
                deadPlayers.Add(first.Key);
                deadPlayers.Add(second.Key);
            }
        }

        foreach (var player in alivePlayers)
        {
            if (deadPlayers.Contains(player.UserId) || !nextHeads.TryGetValue(player.UserId, out var nextHead))
            {
                continue;
            }

            var ownBody = player.Segments.ToList();
            if (!growthMap[player.UserId] && ownBody.Count > 0)
            {
                ownBody.RemoveAt(ownBody.Count - 1);
            }

            if (ownBody.Any(segment => segment.Equals(nextHead)))
            {
                deadPlayers.Add(player.UserId);
                continue;
            }

            var otherPlayers = alivePlayers.Where(other => other.UserId != player.UserId);
            foreach (var otherPlayer in otherPlayers)
            {
                var otherBody = otherPlayer.Segments.ToList();
                if (growthMap.TryGetValue(otherPlayer.UserId, out var otherGrow) && !otherGrow && otherBody.Count > 0)
                {
                    otherBody.RemoveAt(otherBody.Count - 1);
                }

                if (otherBody.Any(segment => segment.Equals(nextHead)))
                {
                    deadPlayers.Add(player.UserId);
                    break;
                }
            }
        }

        foreach (var deadUserId in deadPlayers)
        {
            if (session.Players.TryGetValue(deadUserId, out var player))
            {
                player.IsAlive = false;
            }
        }

        var ateFruit = false;
        foreach (var player in alivePlayers.Where(player => player.IsAlive && nextHeads.ContainsKey(player.UserId)))
        {
            var nextHead = nextHeads[player.UserId];
            var grew = growthMap[player.UserId];

            player.Segments.Insert(0, nextHead);
            if (!grew && player.Segments.Count > 0)
            {
                player.Segments.RemoveAt(player.Segments.Count - 1);
            }

            if (grew)
            {
                player.Score += 1;
                ateFruit = true;
            }
        }

        if (ateFruit)
        {
            session.Fruit = SpawnFruit(session);
        }

        var stillAlive = session.Players.Values.Where(player => player.IsAlive).ToList();
        if (stillAlive.Count == 1)
        {
            session.Phase = "finished";
            session.WinnerUserId = stillAlive[0].UserId;
            session.IsDraw = false;
            session.EndReason = "elimination";
            return;
        }

        if (stillAlive.Count == 0)
        {
            session.Phase = "finished";
            session.WinnerUserId = null;
            session.IsDraw = true;
            session.EndReason = deadPlayers.Count == 2 ? "head-on-collision" : "all-dead";
        }
    }

    private static bool IsInsideBoard(GridPoint point, int width, int height)
    {
        return point.X >= 0 && point.X < width && point.Y >= 0 && point.Y < height;
    }

    private static GridPoint Wrap(GridPoint point, int width, int height)
    {
        var wrappedX = (point.X % width + width) % width;
        var wrappedY = (point.Y % height + height) % height;
        return new GridPoint(wrappedX, wrappedY);
    }

    private static GridPoint Move(GridPoint head, SnakeDirection direction)
    {
        return direction switch
        {
            SnakeDirection.Up => new GridPoint(head.X, head.Y - 1),
            SnakeDirection.Down => new GridPoint(head.X, head.Y + 1),
            SnakeDirection.Left => new GridPoint(head.X - 1, head.Y),
            SnakeDirection.Right => new GridPoint(head.X + 1, head.Y),
            _ => head
        };
    }

    private static bool TryParseDirection(string rawDirection, out SnakeDirection direction)
    {
        direction = rawDirection.Trim().ToLowerInvariant() switch
        {
            "up" => SnakeDirection.Up,
            "down" => SnakeDirection.Down,
            "left" => SnakeDirection.Left,
            "right" => SnakeDirection.Right,
            _ => SnakeDirection.None
        };

        return direction != SnakeDirection.None;
    }

    private static bool IsOpposite(SnakeDirection current, SnakeDirection next)
    {
        return (current == SnakeDirection.Up && next == SnakeDirection.Down)
               || (current == SnakeDirection.Down && next == SnakeDirection.Up)
               || (current == SnakeDirection.Left && next == SnakeDirection.Right)
               || (current == SnakeDirection.Right && next == SnakeDirection.Left);
    }

    private static GridPoint SpawnFruit(SnakeMatchSession session)
    {
        var occupied = new HashSet<GridPoint>();
        foreach (var segment in session.Players.Values.SelectMany(player => player.Segments))
        {
            occupied.Add(segment);
        }

        for (var attempt = 0; attempt < 200; attempt++)
        {
            var candidate = new GridPoint(
                Random.Shared.Next(0, session.Width),
                Random.Shared.Next(0, session.Height));

            if (!occupied.Contains(candidate))
            {
                return candidate;
            }
        }

        return new GridPoint(session.Width / 2, session.Height / 2);
    }

    private static SnakeStateDto ToDto(SnakeMatchSession session)
    {
        return new SnakeStateDto
        {
            RoomId = session.RoomId,
            Phase = session.Phase,
            Countdown = session.Countdown,
            Tick = session.Tick,
            Width = session.Width,
            Height = session.Height,
            IsWallFatal = session.IsWallFatal,
            Fruit = new GridPointDto
            {
                X = session.Fruit.X,
                Y = session.Fruit.Y
            },
            Players = session.Players.Values
                .Select(player => new SnakePlayerStateDto
                {
                    UserId = player.UserId,
                    DisplayName = player.DisplayName,
                    AvatarUrl = player.AvatarUrl,
                    Color = player.Color,
                    Direction = player.Direction.ToString().ToLowerInvariant(),
                    Segments = player.Segments
                        .Select(segment => new GridPointDto
                        {
                            X = segment.X,
                            Y = segment.Y
                        })
                        .ToList(),
                    Score = player.Score,
                    Length = player.Segments.Count,
                    IsAlive = player.IsAlive
                })
                .ToList(),
            WinnerUserId = session.WinnerUserId,
            IsDraw = session.IsDraw,
            EndReason = session.EndReason
        };
    }

    private static GameOverDto BuildGameOver(SnakeMatchSession session)
    {
        return new GameOverDto
        {
            RoomId = session.RoomId,
            GameType = GameTypes.SnakeDuo,
            WinnerUserId = session.WinnerUserId,
            IsDraw = session.IsDraw,
            Reason = string.IsNullOrWhiteSpace(session.EndReason) ? "finished" : session.EndReason,
            FinalState = ToDto(session)
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
            _logger.LogDebug(exception, "Skip mark-finished for snake room {RoomId}.", roomId);
        }
    }

    private sealed class SnakeMatchSession
    {
        public object SyncRoot { get; } = new();

        public CancellationTokenSource CancellationTokenSource { get; } = new();

        public Guid RoomId { get; init; }

        public required string Phase { get; set; }

        public int Countdown { get; set; }

        public int Tick { get; set; }

        public int Width { get; init; }

        public int Height { get; init; }

        public bool IsWallFatal { get; init; }

        public GridPoint Fruit { get; set; }

        public Dictionary<Guid, SnakePlayerRuntime> Players { get; } = [];

        public Guid? WinnerUserId { get; set; }

        public bool IsDraw { get; set; }

        public string? EndReason { get; set; }
    }

    private sealed class SnakePlayerRuntime
    {
        public Guid UserId { get; init; }

        public required string DisplayName { get; init; }

        public required string AvatarUrl { get; init; }

        public required string Color { get; init; }

        public SnakeDirection Direction { get; set; }

        public SnakeDirection PendingDirection { get; set; }

        public List<GridPoint> Segments { get; init; } = [];

        public int Score { get; set; }

        public bool IsAlive { get; set; } = true;
    }

    private readonly record struct GridPoint(int X, int Y);

    private enum SnakeDirection
    {
        None = 0,
        Up = 1,
        Down = 2,
        Left = 3,
        Right = 4
    }
}

using System.Collections.Concurrent;
using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Flappy;
using InteractHub.Api.Application.Interfaces.Services.Games;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services.Games;

public sealed class FlappyGameService : IFlappyGameService
{
    private const int TickRate = 20;
    private const int TickIntervalMs = 1000 / TickRate;
    private const double WorldWidth = 960;
    private const double WorldHeight = 540;
    private const double GroundHeight = 60;
    private const double BirdRadius = 14;
    private const double Gravity = 0.42;
    private const double FlapVelocity = -6.8;
    private const double PipeSpeed = 3.2;
    private const double PipeWidth = 90;
    private const double PipeGapHeight = 170;
    private const int PipeSpawnIntervalTicks = 42;

    private readonly ConcurrentDictionary<Guid, FlappyMatchSession> _sessions = new();
    private readonly IGameRealtimeService _realtimeService;
    private readonly IGameRoomService _gameRoomService;
    private readonly ILogger<FlappyGameService> _logger;

    public FlappyGameService(
        IGameRealtimeService realtimeService,
        IGameRoomService gameRoomService,
        ILogger<FlappyGameService> logger)
    {
        _realtimeService = realtimeService;
        _gameRoomService = gameRoomService;
        _logger = logger;
    }

    public FlappyStateDto StartGame(GameRoomDto room)
    {
        if (room.Players.Count < 2)
        {
            throw new InvalidOperationException("Flappy Duo requires 2 players.");
        }

        RemoveRoom(room.RoomId);

        var orderedPlayers = room.Players
            .OrderBy(player => player.JoinedAt)
            .Take(2)
            .ToList();

        var session = BuildSession(room.RoomId, orderedPlayers);
        _sessions[room.RoomId] = session;
        _ = RunLoopAsync(session);
        return ToDto(session);
    }

    public bool QueueInput(Guid userId, FlappyInputDto input)
    {
        if (!_sessions.TryGetValue(input.RoomId, out var session))
        {
            return false;
        }

        lock (session.SyncRoot)
        {
            if (!session.Players.TryGetValue(userId, out var player) || !player.IsAlive)
            {
                return false;
            }

            if (!string.Equals(input.Action, "flap", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            player.PendingFlap = true;
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

    public FlappyStateDto? GetState(Guid roomId)
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

    private async Task RunLoopAsync(FlappyMatchSession session)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(TickIntervalMs));
        try
        {
            while (await timer.WaitForNextTickAsync(session.CancellationTokenSource.Token))
            {
                GameOverDto? gameOver = null;
                FlappyStateDto snapshot;

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
                        GameType = GameTypes.FlappyDuo,
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
            // Session canceled by room removal or rematch restart.
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Flappy session loop crashed for room {RoomId}.", session.RoomId);
        }
    }

    private static FlappyMatchSession BuildSession(Guid roomId, IReadOnlyList<GameRoomPlayerDto> players)
    {
        var player1 = players[0];
        var player2 = players[1];

        var session = new FlappyMatchSession
        {
            RoomId = roomId,
            Phase = "countdown",
            Countdown = 3,
            Tick = 0,
            Width = WorldWidth,
            Height = WorldHeight,
            GroundHeight = GroundHeight,
            SpawnCounter = PipeSpawnIntervalTicks
        };

        session.Players[player1.UserId] = new FlappyPlayerRuntime
        {
            UserId = player1.UserId,
            DisplayName = player1.DisplayName,
            AvatarUrl = player1.AvatarUrl,
            X = 220,
            Y = (WorldHeight - GroundHeight) / 2,
            VelocityY = 0
        };

        session.Players[player2.UserId] = new FlappyPlayerRuntime
        {
            UserId = player2.UserId,
            DisplayName = player2.DisplayName,
            AvatarUrl = player2.AvatarUrl,
            X = 300,
            Y = (WorldHeight - GroundHeight) / 2,
            VelocityY = 0
        };

        return session;
    }

    private static void AdvancePlayingTick(FlappyMatchSession session)
    {
        session.SpawnCounter--;
        if (session.SpawnCounter <= 0)
        {
            session.SpawnCounter = PipeSpawnIntervalTicks;
            session.Pipes.Add(new FlappyPipeRuntime
            {
                PipeId = session.NextPipeId++,
                X = session.Width + 20,
                Width = PipeWidth,
                GapY = Random.Shared.NextDouble() * 170 + 140,
                GapHeight = PipeGapHeight
            });
        }

        foreach (var pipe in session.Pipes)
        {
            pipe.X -= PipeSpeed;
        }

        session.Pipes.RemoveAll(pipe => pipe.X + pipe.Width < -20);

        foreach (var player in session.Players.Values.Where(player => player.IsAlive))
        {
            if (player.PendingFlap)
            {
                player.VelocityY = FlapVelocity;
                player.PendingFlap = false;
            }

            player.VelocityY += Gravity;
            player.Y += player.VelocityY;

            if (player.Y - BirdRadius <= 0 || player.Y + BirdRadius >= session.Height - session.GroundHeight)
            {
                player.IsAlive = false;
                continue;
            }

            foreach (var pipe in session.Pipes)
            {
                var playerIntersectsPipeX = player.X + BirdRadius > pipe.X && player.X - BirdRadius < pipe.X + pipe.Width;
                if (!playerIntersectsPipeX)
                {
                    continue;
                }

                var gapTop = pipe.GapY - pipe.GapHeight / 2;
                var gapBottom = pipe.GapY + pipe.GapHeight / 2;
                var hitsUpperPipe = player.Y - BirdRadius < gapTop;
                var hitsLowerPipe = player.Y + BirdRadius > gapBottom;

                if (hitsUpperPipe || hitsLowerPipe)
                {
                    player.IsAlive = false;
                    break;
                }
            }

            if (!player.IsAlive)
            {
                continue;
            }

            foreach (var pipe in session.Pipes)
            {
                if (player.PassedPipeIds.Contains(pipe.PipeId))
                {
                    continue;
                }

                if (player.X > pipe.X + pipe.Width)
                {
                    player.PassedPipeIds.Add(pipe.PipeId);
                    player.Score++;
                }
            }
        }

        var alivePlayers = session.Players.Values.Where(player => player.IsAlive).ToList();
        if (alivePlayers.Count == 1)
        {
            session.Phase = "finished";
            session.WinnerUserId = alivePlayers[0].UserId;
            session.IsDraw = false;
            session.EndReason = "elimination";
            return;
        }

        if (alivePlayers.Count == 0)
        {
            session.Phase = "finished";
            session.WinnerUserId = null;
            session.IsDraw = true;
            session.EndReason = "both-dead";
        }
    }

    private static FlappyStateDto ToDto(FlappyMatchSession session)
    {
        return new FlappyStateDto
        {
            RoomId = session.RoomId,
            Phase = session.Phase,
            Countdown = session.Countdown,
            Tick = session.Tick,
            Width = session.Width,
            Height = session.Height,
            GroundHeight = session.GroundHeight,
            Players = session.Players.Values
                .Select(player => new FlappyPlayerStateDto
                {
                    UserId = player.UserId,
                    DisplayName = player.DisplayName,
                    AvatarUrl = player.AvatarUrl,
                    X = player.X,
                    Y = player.Y,
                    VelocityY = player.VelocityY,
                    Score = player.Score,
                    IsAlive = player.IsAlive
                })
                .ToList(),
            Pipes = session.Pipes
                .Select(pipe => new FlappyPipeDto
                {
                    PipeId = pipe.PipeId,
                    X = pipe.X,
                    Width = pipe.Width,
                    GapY = pipe.GapY,
                    GapHeight = pipe.GapHeight
                })
                .ToList(),
            WinnerUserId = session.WinnerUserId,
            IsDraw = session.IsDraw,
            EndReason = session.EndReason
        };
    }

    private static GameOverDto BuildGameOver(FlappyMatchSession session)
    {
        return new GameOverDto
        {
            RoomId = session.RoomId,
            GameType = GameTypes.FlappyDuo,
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
            _logger.LogDebug(exception, "Skip mark-finished for flappy room {RoomId}.", roomId);
        }
    }

    private sealed class FlappyMatchSession
    {
        public object SyncRoot { get; } = new();

        public CancellationTokenSource CancellationTokenSource { get; } = new();

        public Guid RoomId { get; init; }

        public required string Phase { get; set; }

        public int Countdown { get; set; }

        public int Tick { get; set; }

        public double Width { get; init; }

        public double Height { get; init; }

        public double GroundHeight { get; init; }

        public int SpawnCounter { get; set; }

        public int NextPipeId { get; set; } = 1;

        public Dictionary<Guid, FlappyPlayerRuntime> Players { get; } = [];

        public List<FlappyPipeRuntime> Pipes { get; } = [];

        public Guid? WinnerUserId { get; set; }

        public bool IsDraw { get; set; }

        public string? EndReason { get; set; }
    }

    private sealed class FlappyPlayerRuntime
    {
        public Guid UserId { get; init; }

        public required string DisplayName { get; init; }

        public required string AvatarUrl { get; init; }

        public double X { get; init; }

        public double Y { get; set; }

        public double VelocityY { get; set; }

        public int Score { get; set; }

        public bool PendingFlap { get; set; }

        public bool IsAlive { get; set; } = true;

        public HashSet<int> PassedPipeIds { get; } = [];
    }

    private sealed class FlappyPipeRuntime
    {
        public int PipeId { get; init; }

        public double X { get; set; }

        public double Width { get; init; }

        public double GapY { get; init; }

        public double GapHeight { get; init; }
    }
}

using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using System.Collections.Concurrent;
using ChessDotNet;
using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Chess;
using InteractHub.Api.Application.Interfaces.Services.Games;

namespace InteractHub.Api.Application.Services.Games;

public sealed class ChessService : IChessService
{
    private readonly ConcurrentDictionary<Guid, ChessMatchState> _matches = new();

    public ChessStateDto StartGame(GameRoomDto room)
    {
        if (room.Players.Count < 2)
        {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION, "Chess requires 2 players.");
        }

        var whiteUserId = room.Players[0].UserId;
        var blackUserId = room.Players[1].UserId;

        var state = new ChessMatchState
        {
            RoomId = room.RoomId,
            WhiteUserId = whiteUserId,
            BlackUserId = blackUserId,
            Game = new ChessGame()
        };

        _matches[room.RoomId] = state;
        return ToDto(state);
    }

    public ChessMoveOutcomeDto SubmitMove(Guid userId, ChessMoveInputDto input)
    {
        if (!_matches.TryGetValue(input.RoomId, out var state))
        {
            return BuildRejectedOutcome("Chess match not found.");
        }

        lock (state.SyncRoot)
        {
            if (state.IsFinished)
            {
                return BuildRejectedOutcome("Match already finished.");
            }

            var currentTurnUserId = state.Game.WhoseTurn == Player.White
                ? state.WhiteUserId
                : state.BlackUserId;

            if (userId != currentTurnUserId)
            {
                return BuildRejectedOutcome("Not your turn.");
            }

            var promotion = ResolvePromotion(input.Promotion);
            var move = new Move(
                input.From.Trim().ToLowerInvariant(),
                input.To.Trim().ToLowerInvariant(),
                state.Game.WhoseTurn,
                promotion);

            if (!state.Game.IsValidMove(move))
            {
                return BuildRejectedOutcome("Illegal chess move.");
            }

            state.Game.MakeMove(move, true);

            var moveRecord = new ChessMoveRecordDto
            {
                MoveNumber = state.MoveHistory.Count + 1,
                UserId = userId,
                From = input.From.Trim().ToLowerInvariant(),
                To = input.To.Trim().ToLowerInvariant(),
                Promotion = string.IsNullOrWhiteSpace(input.Promotion) ? null : input.Promotion.Trim().ToLowerInvariant(),
                Notation = BuildNotation(input),
                MovedAt = DateTime.UtcNow
            };
            state.MoveHistory.Add(moveRecord);

            GameOverDto? gameOver = null;
            var nextPlayer = state.Game.WhoseTurn;

            if (state.Game.IsCheckmated(nextPlayer))
            {
                state.IsFinished = true;
                state.WinnerUserId = userId;
                state.EndReason = "checkmate";
                gameOver = BuildGameOver(state, state.WinnerUserId, isDraw: false, reason: state.EndReason);
            }
            else if (state.Game.IsStalemated(nextPlayer))
            {
                state.IsFinished = true;
                state.IsDraw = true;
                state.EndReason = "stalemate";
                gameOver = BuildGameOver(state, winnerUserId: null, isDraw: true, reason: state.EndReason);
            }
            else if (state.Game.IsDraw())
            {
                state.IsFinished = true;
                state.IsDraw = true;
                state.EndReason = "draw";
                gameOver = BuildGameOver(state, winnerUserId: null, isDraw: true, reason: state.EndReason);
            }

            var dto = ToDto(state);
            if (gameOver is not null)
            {
                gameOver = new GameOverDto
                {
                    RoomId = gameOver.RoomId,
                    GameType = gameOver.GameType,
                    WinnerUserId = gameOver.WinnerUserId,
                    IsDraw = gameOver.IsDraw,
                    Reason = gameOver.Reason,
                    FinalState = dto
                };
            }

            return new ChessMoveOutcomeDto
            {
                Accepted = true,
                Move = moveRecord,
                State = dto,
                GameOver = gameOver
            };
        }
    }

    public GameOverDto Resign(Guid userId, ChessResignInputDto input)
    {
        if (!_matches.TryGetValue(input.RoomId, out var state))
        {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Chess match not found.");
        }

        lock (state.SyncRoot)
        {
            if (state.IsFinished)
            {
                throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION, "Match already finished.");
            }

            if (userId != state.WhiteUserId && userId != state.BlackUserId)
            {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Player is not part of this match.");
            }

            state.IsFinished = true;
            state.IsDraw = false;
            state.EndReason = "resign";
            state.WinnerUserId = userId == state.WhiteUserId
                ? state.BlackUserId
                : state.WhiteUserId;

            return BuildGameOver(state, state.WinnerUserId, isDraw: false, reason: state.EndReason);
        }
    }

    public GameOverDto? HandlePlayerDisconnect(Guid roomId, Guid disconnectedUserId)
    {
        if (!_matches.TryGetValue(roomId, out var state))
        {
            return null;
        }

        lock (state.SyncRoot)
        {
            if (state.IsFinished)
            {
                return null;
            }

            if (disconnectedUserId != state.WhiteUserId && disconnectedUserId != state.BlackUserId)
            {
                return null;
            }

            state.IsFinished = true;
            state.IsDraw = false;
            state.EndReason = "disconnect";
            state.WinnerUserId = disconnectedUserId == state.WhiteUserId
                ? state.BlackUserId
                : state.WhiteUserId;

            return BuildGameOver(state, state.WinnerUserId, isDraw: false, reason: state.EndReason);
        }
    }

    public ChessStateDto? GetState(Guid roomId)
    {
        if (!_matches.TryGetValue(roomId, out var state))
        {
            return null;
        }

        lock (state.SyncRoot)
        {
            return ToDto(state);
        }
    }

    public void RemoveRoom(Guid roomId)
    {
        _matches.TryRemove(roomId, out _);
    }

    private static ChessMoveOutcomeDto BuildRejectedOutcome(string error)
    {
        return new ChessMoveOutcomeDto
        {
            Accepted = false,
            Error = error
        };
    }

    private static string BuildNotation(ChessMoveInputDto input)
    {
        var promotion = string.IsNullOrWhiteSpace(input.Promotion)
            ? string.Empty
            : $"={input.Promotion!.Trim().ToUpperInvariant()}";

        return $"{input.From.Trim().ToLowerInvariant()}-{input.To.Trim().ToLowerInvariant()}{promotion}";
    }

    private static char? ResolvePromotion(string? rawPromotion)
    {
        if (string.IsNullOrWhiteSpace(rawPromotion))
        {
            return null;
        }

        return rawPromotion.Trim().ToLowerInvariant() switch
        {
            "q" => 'Q',
            "r" => 'R',
            "b" => 'B',
            "n" => 'N',
            _ => null
        };
    }

    private static GameOverDto BuildGameOver(ChessMatchState state, Guid? winnerUserId, bool isDraw, string? reason)
    {
        var finalState = ToDto(state);
        return new GameOverDto
        {
            RoomId = state.RoomId,
            GameType = GameTypes.Chess,
            WinnerUserId = winnerUserId,
            IsDraw = isDraw,
            Reason = string.IsNullOrWhiteSpace(reason) ? "finished" : reason,
            FinalState = finalState
        };
    }

    private static ChessStateDto ToDto(ChessMatchState state)
    {
        var turnPlayer = state.Game.WhoseTurn;
        var currentTurnUserId = turnPlayer == Player.White ? state.WhiteUserId : state.BlackUserId;
        var isCheck = state.Game.IsInCheck(turnPlayer);

        return new ChessStateDto
        {
            RoomId = state.RoomId,
            Fen = state.Game.GetFen(),
            WhiteUserId = state.WhiteUserId,
            BlackUserId = state.BlackUserId,
            CurrentTurnUserId = currentTurnUserId,
            IsCheck = isCheck,
            CheckedUserId = isCheck ? currentTurnUserId : null,
            IsCheckmate = state.Game.IsCheckmated(turnPlayer),
            IsStalemate = state.Game.IsStalemated(turnPlayer),
            IsFinished = state.IsFinished,
            WinnerUserId = state.WinnerUserId,
            EndReason = state.EndReason,
            MoveHistory = state.MoveHistory.ToList()
        };
    }

    private sealed class ChessMatchState
    {
        public object SyncRoot { get; } = new();

        public Guid RoomId { get; init; }

        public Guid WhiteUserId { get; init; }

        public Guid BlackUserId { get; init; }

        public required ChessGame Game { get; init; }

        public List<ChessMoveRecordDto> MoveHistory { get; } = [];

        public bool IsFinished { get; set; }

        public bool IsDraw { get; set; }

        public Guid? WinnerUserId { get; set; }

        public string? EndReason { get; set; }
    }
}

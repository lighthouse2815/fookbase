using System.Collections.Concurrent;
using InteractHub.Api.Application.DTOs.Games;
using InteractHub.Api.Application.DTOs.Games.Caro;
using InteractHub.Api.Application.Interfaces.Services.Games;

namespace InteractHub.Api.Application.Services.Games;

public sealed class CaroService : ICaroService
{
    private readonly ConcurrentDictionary<Guid, CaroMatchState> _matches = new();

    public CaroStateDto StartGame(GameRoomDto room, int boardSize = 15)
    {
        if (room.Players.Count < 2)
        {
            throw new InvalidOperationException("Caro requires 2 players.");
        }

        if (boardSize < 10 || boardSize > 30)
        {
            throw new ArgumentException("Board size must be between 10 and 30.");
        }

        var xUserId = room.Players[0].UserId;
        var oUserId = room.Players[1].UserId;
        var board = new string?[boardSize][];
        for (var row = 0; row < boardSize; row++)
        {
            board[row] = new string?[boardSize];
        }

        var state = new CaroMatchState
        {
            RoomId = room.RoomId,
            BoardSize = boardSize,
            XUserId = xUserId,
            OUserId = oUserId,
            CurrentTurnUserId = xUserId,
            Board = board
        };

        _matches[room.RoomId] = state;
        return ToDto(state);
    }

    public CaroMoveOutcomeDto SubmitMove(Guid userId, CaroMoveInputDto input)
    {
        if (!_matches.TryGetValue(input.RoomId, out var state))
        {
            return new CaroMoveOutcomeDto
            {
                Accepted = false,
                Error = "Caro match not found."
            };
        }

        lock (state.SyncRoot)
        {
            if (state.IsFinished)
            {
                return BuildRejectedOutcome("Match already finished.");
            }

            if (userId != state.CurrentTurnUserId)
            {
                return BuildRejectedOutcome("Not your turn.");
            }

            if (input.Row < 0 || input.Row >= state.BoardSize || input.Col < 0 || input.Col >= state.BoardSize)
            {
                return BuildRejectedOutcome("Move is outside the board.");
            }

            if (!string.IsNullOrWhiteSpace(state.Board[input.Row][input.Col]))
            {
                return BuildRejectedOutcome("Cell is already occupied.");
            }

            var symbol = ResolveSymbol(state, userId);
            if (symbol is null)
            {
                return BuildRejectedOutcome("Player is not part of this match.");
            }

            state.Board[input.Row][input.Col] = symbol;

            var move = new CaroMoveRecordDto
            {
                Turn = state.MoveHistory.Count + 1,
                UserId = userId,
                Symbol = symbol,
                Row = input.Row,
                Col = input.Col,
                MovedAt = DateTime.UtcNow
            };

            state.MoveHistory.Add(move);

            GameOverDto? gameOver = null;

            if (HasFiveInRow(state.Board, input.Row, input.Col, symbol))
            {
                state.IsFinished = true;
                state.WinnerUserId = userId;
                state.EndReason = "five-in-row";
                gameOver = BuildGameOver(state.RoomId, userId, isDraw: false, reason: state.EndReason);
            }
            else if (IsBoardFull(state.Board))
            {
                state.IsFinished = true;
                state.IsDraw = true;
                state.EndReason = "draw-full-board";
                gameOver = BuildGameOver(state.RoomId, winnerUserId: null, isDraw: true, reason: state.EndReason);
            }
            else
            {
                state.CurrentTurnUserId = userId == state.XUserId
                    ? state.OUserId
                    : state.XUserId;
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

            return new CaroMoveOutcomeDto
            {
                Accepted = true,
                Move = move,
                State = dto,
                GameOver = gameOver
            };
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

            var players = new[] { state.XUserId, state.OUserId };
            if (players.All(userId => userId != disconnectedUserId))
            {
                return null;
            }

            var winnerUserId = players.FirstOrDefault(userId => userId != disconnectedUserId);
            state.IsFinished = true;
            state.WinnerUserId = winnerUserId == Guid.Empty ? null : winnerUserId;
            state.IsDraw = winnerUserId == Guid.Empty;
            state.EndReason = "disconnect";

            return new GameOverDto
            {
                RoomId = roomId,
                GameType = GameTypes.Caro,
                WinnerUserId = winnerUserId == Guid.Empty ? null : winnerUserId,
                IsDraw = winnerUserId == Guid.Empty,
                Reason = "disconnect",
                FinalState = ToDto(state)
            };
        }
    }

    public CaroStateDto? GetState(Guid roomId)
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

    private static CaroMoveOutcomeDto BuildRejectedOutcome(string error)
    {
        return new CaroMoveOutcomeDto
        {
            Accepted = false,
            Error = error
        };
    }

    private static string? ResolveSymbol(CaroMatchState state, Guid userId)
    {
        if (userId == state.XUserId)
        {
            return "X";
        }

        if (userId == state.OUserId)
        {
            return "O";
        }

        return null;
    }

    private static bool IsBoardFull(string?[][] board)
    {
        return board.All(row => row.All(cell => !string.IsNullOrWhiteSpace(cell)));
    }

    private static bool HasFiveInRow(string?[][] board, int row, int col, string symbol)
    {
        var directions = new (int dRow, int dCol)[]
        {
            (1, 0),
            (0, 1),
            (1, 1),
            (1, -1)
        };

        foreach (var (dRow, dCol) in directions)
        {
            var count = 1
                + CountDirection(board, row, col, dRow, dCol, symbol)
                + CountDirection(board, row, col, -dRow, -dCol, symbol);

            if (count >= 5)
            {
                return true;
            }
        }

        return false;
    }

    private static int CountDirection(string?[][] board, int row, int col, int dRow, int dCol, string symbol)
    {
        var count = 0;
        var currentRow = row + dRow;
        var currentCol = col + dCol;

        while (currentRow >= 0
               && currentRow < board.Length
               && currentCol >= 0
               && currentCol < board[currentRow].Length
               && string.Equals(board[currentRow][currentCol], symbol, StringComparison.Ordinal))
        {
            count++;
            currentRow += dRow;
            currentCol += dCol;
        }

        return count;
    }

    private static GameOverDto BuildGameOver(Guid roomId, Guid? winnerUserId, bool isDraw, string? reason)
    {
        return new GameOverDto
        {
            RoomId = roomId,
            GameType = GameTypes.Caro,
            WinnerUserId = winnerUserId,
            IsDraw = isDraw,
            Reason = string.IsNullOrWhiteSpace(reason) ? "finished" : reason
        };
    }

    private static CaroStateDto ToDto(CaroMatchState state)
    {
        var boardCopy = new string?[state.BoardSize][];
        for (var row = 0; row < state.BoardSize; row++)
        {
            boardCopy[row] = new string?[state.BoardSize];
            Array.Copy(state.Board[row], boardCopy[row], state.BoardSize);
        }

        return new CaroStateDto
        {
            RoomId = state.RoomId,
            BoardSize = state.BoardSize,
            XUserId = state.XUserId,
            OUserId = state.OUserId,
            CurrentTurnUserId = state.CurrentTurnUserId,
            Board = boardCopy,
            LastMove = state.MoveHistory.Count > 0 ? state.MoveHistory[^1] : null,
            MoveHistory = state.MoveHistory.ToList(),
            IsFinished = state.IsFinished,
            WinnerUserId = state.WinnerUserId,
            IsDraw = state.IsDraw,
            EndReason = state.EndReason
        };
    }

    private sealed class CaroMatchState
    {
        public object SyncRoot { get; } = new();

        public Guid RoomId { get; init; }

        public int BoardSize { get; init; }

        public Guid XUserId { get; init; }

        public Guid OUserId { get; init; }

        public Guid CurrentTurnUserId { get; set; }

        public required string?[][] Board { get; init; }

        public List<CaroMoveRecordDto> MoveHistory { get; } = [];

        public bool IsFinished { get; set; }

        public Guid? WinnerUserId { get; set; }

        public bool IsDraw { get; set; }

        public string? EndReason { get; set; }
    }
}

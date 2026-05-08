using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
namespace InteractHub.Api.Application.Services.Games;

public static class GameTypes
{
    public const string Chess = "chess";
    public const string Caro = "caro";
    public const string SnakeDuo = "snake-duo";
    public const string FlappyDuo = "flappy-duo";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Chess,
        Caro,
        SnakeDuo,
        FlappyDuo
    };

    public static bool IsSupported(string? rawGameType)
    {
        if (string.IsNullOrWhiteSpace(rawGameType))
        {
            return false;
        }

        return All.Contains(rawGameType.Trim());
    }

    public static string Normalize(string rawGameType)
    {
        if (string.IsNullOrWhiteSpace(rawGameType))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "gameType is required.");
        }

        var normalized = rawGameType.Trim().ToLowerInvariant();
        if (!All.Contains(normalized))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, $"Unsupported gameType: {rawGameType}.");
        }

        return normalized;
    }
}


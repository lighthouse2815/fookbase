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
            throw new ArgumentException("gameType is required.");
        }

        var normalized = rawGameType.Trim().ToLowerInvariant();
        if (!All.Contains(normalized))
        {
            throw new ArgumentException($"Unsupported gameType: {rawGameType}.");
        }

        return normalized;
    }
}


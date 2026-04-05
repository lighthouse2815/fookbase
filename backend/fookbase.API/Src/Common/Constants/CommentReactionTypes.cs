namespace InteractHub.Api.Common.Constants;

public static class CommentReactionTypes
{
    public const string Like = "LIKE";
    public const string Wow = "WOW";
    public const string Sad = "SAD";
    public const string Angry = "ANGRY";
    public const string Haha = "HAHA";
    public const string Love = "LOVE";

    private static readonly HashSet<string> AllowedValues = new(StringComparer.Ordinal)
    {
        Like,
        Wow,
        Sad,
        Angry,
        Haha,
        Love
    };

    public static bool IsValid(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return false;
        }

        return AllowedValues.Contains(type.Trim().ToUpperInvariant());
    }

    public static string Normalize(string type)
    {
        return type.Trim().ToUpperInvariant();
    }
}

namespace InteractHub.Api.Common.Utilities;

public static class AvatarUrlHelper
{
    private const string DefaultAvatarBaseUrl = "https://i.pravatar.cc/150";

    public static string BuildDefaultAvatarUrl(Guid userId)
    {
        return BuildDefaultAvatarUrl(userId.ToString());
    }

    public static string BuildDefaultAvatarUrl(string seed)
    {
        if (string.IsNullOrWhiteSpace(seed))
        {
            return DefaultAvatarBaseUrl;
        }

        return $"{DefaultAvatarBaseUrl}?u={Uri.EscapeDataString(seed.Trim())}";
    }
}

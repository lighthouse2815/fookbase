namespace InteractHub.Api.Common.Utilities;

public static class AvatarUrlHelper
{
    public const string DefaultAvatarUrl =
        "https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg";

    public static string BuildDefaultAvatarUrl(Guid userId)
    {
        return BuildDefaultAvatarUrl(userId.ToString());
    }

    public static string BuildDefaultAvatarUrl(string seed)
    {
        return DefaultAvatarUrl;
    }
}




namespace InteractHub.Api.Common.Models;

public class JavaApiOptions
{
    public const string SectionName = "JavaApi";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string UserByIdPathTemplate { get; set; } = "users/{id}";

    public string ProfileByUserIdPathTemplate { get; set; } = "profiles?userId={userId}";

    public string FriendsByUserIdPathTemplate { get; set; } = "friendships?userId={userId}";

    public string AuthRegisterPathTemplate { get; set; } = "auth/register";

    public string AuthLoginPathTemplate { get; set; } = "auth/login";
}

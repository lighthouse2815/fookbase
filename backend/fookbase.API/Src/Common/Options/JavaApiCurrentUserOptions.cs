namespace InteractHub.Api.Common.Options;

public class JavaApiCurrentUserOptions
{
    public const string SectionName = "JavaApi:CurrentUser";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string ProfileMeSecurityPrivatePathTemplate { get; set; } = "profiles/me/security-private";

    public string ProfileMeSecurityPrivateUpdatePathTemplate { get; set; } = "profiles/me/security-private";
}


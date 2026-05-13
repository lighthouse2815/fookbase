namespace InteractHub.Api.Common.Options;

public class JavaApiUserProfileOptions
{
    public const string SectionName = "JavaApi:UserProfile";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string ProfileByUserIdPathTemplate { get; set; } = "profiles/public?userId={userId}";

    public string ProfileMeOverviewPathTemplate { get; set; } = "profiles/me/overview";

    public string ProfileMeInfoSettingsPathTemplate { get; set; } = "profiles/me/profile-info-settings";

    public string ProfileMeInfoSettingsVisibilityPathTemplate { get; set; } = "profiles/me/profile-info-settings/visibility";

    public string ProfileMeInfoSettingsVisibilityUpdatePathTemplate { get; set; } = "profiles/me/profile-info-settings/visibility";

    public string ProfileMeUpdatePathTemplate { get; set; } = "profiles/me";

    public string ProfileSearchByPhonePathTemplate { get; set; } = "profiles/search?phoneNumber={phoneNumber}";

    public string ProfileSearchByDisplayNamePathTemplate { get; set; } = "profiles/search/display-name?displayName={displayName}";

    public string ProfileSummaryByUserIdPathTemplate { get; set; } = "profiles/summary?userId={userId}";

    public string ProfileSummariesByUserIdsPathTemplate { get; set; } = "profiles/summaries";
}

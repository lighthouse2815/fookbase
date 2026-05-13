namespace InteractHub.Api.Common.Options;

public class JavaApiAdminOptions
{
    public const string SectionName = "JavaApi:Admin";

    public string SearchUsersPathTemplate { get; set; } = "admin/users/search?keyword={keyword}";

    public string UpdateUserStatusPathTemplate { get; set; } = "admin/users/{userId}/status";

    public string UserStatsPathTemplate { get; set; } = "admin/users/stats";
}




namespace InteractHub.Api.Common.Models;

public class UserReadModelOptions
{
    public const string SectionName = "UserReadModel";

    public int ProfileCacheTtlSeconds { get; set; } = 300;
}

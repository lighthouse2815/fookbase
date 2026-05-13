namespace InteractHub.Api.Common.Models;

public class UserReadModelOptions
{
    public const string SectionName = "UserReadModel";

    public int ProfileCacheTtlSeconds { get; set; } = 300;

    public int FriendshipContactSnapshotTtlSeconds { get; set; } = 300;

    public int FriendshipBlockedSnapshotTtlSeconds { get; set; } = 300;
}




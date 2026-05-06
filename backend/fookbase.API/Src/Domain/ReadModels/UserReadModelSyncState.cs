namespace InteractHub.Api.Domain.Entities;

public class UserReadModelSyncState
{
    public Guid UserId { get; set; }

    public DateTime? LastBlockedSnapshotAtUtc { get; set; }

    public DateTime? LastContactSnapshotAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

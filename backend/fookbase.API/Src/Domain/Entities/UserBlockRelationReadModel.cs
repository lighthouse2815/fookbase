namespace InteractHub.Api.Domain.Entities;

public class UserBlockRelationReadModel
{
    public Guid OwnerUserId { get; set; }

    public Guid BlockedUserId { get; set; }

    public bool IsBlocked { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

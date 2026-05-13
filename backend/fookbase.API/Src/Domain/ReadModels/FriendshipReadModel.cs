using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class FriendshipReadModel
{
    public Guid OwnerUserId { get; set; }

    public Guid OtherUserId { get; set; }

    public FriendshipStatus Status { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

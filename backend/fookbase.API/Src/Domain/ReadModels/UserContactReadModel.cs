namespace InteractHub.Api.Domain.Entities;

public class UserContactReadModel
{
    public Guid OwnerUserId { get; set; }

    public Guid ContactUserId { get; set; }

    public bool IsActive { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}

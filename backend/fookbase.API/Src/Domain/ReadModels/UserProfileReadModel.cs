namespace InteractHub.Api.Domain.Entities;

public class UserProfileReadModel
{
    public Guid UserId { get; set; }

    public string DisplayName { get; set; } = "user";

    public string AvatarUrl { get; set; } = string.Empty;

    public DateTime UpdatedAtUtc { get; set; }
}

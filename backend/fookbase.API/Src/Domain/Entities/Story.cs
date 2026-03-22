namespace InteractHub.Api.Domain.Entities;

public class Story
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string MediaUrl { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}

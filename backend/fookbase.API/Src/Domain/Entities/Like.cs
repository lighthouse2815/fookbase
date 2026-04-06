namespace InteractHub.Api.Domain.Entities;

public class Like
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid UserId { get; set; }

    public string Type { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Post? Post { get; set; }
}

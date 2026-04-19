namespace InteractHub.Api.Domain.Entities;

public class PostMedia
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Post Post { get; set; } = null!;

    public string MediaUrl { get; set; } = string.Empty;

    public string MediaType { get; set; } = "IMAGE";

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}

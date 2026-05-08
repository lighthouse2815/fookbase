namespace InteractHub.Api.Domain.Entities;

public class Hashtag
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();
}

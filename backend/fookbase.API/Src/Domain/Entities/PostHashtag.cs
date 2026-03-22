namespace InteractHub.Api.Domain.Entities;

public class PostHashtag
{
    public Guid PostId { get; set; }

    public Guid HashtagId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Post? Post { get; set; }

    public Hashtag? Hashtag { get; set; }
}

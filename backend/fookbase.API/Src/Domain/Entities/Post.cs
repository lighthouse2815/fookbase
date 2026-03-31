namespace InteractHub.Api.Domain.Entities;

public class Post
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public ICollection<Like> Likes { get; set; } = new List<Like>();

    public ICollection<PostHashtag> PostHashtags { get; set; } = new List<PostHashtag>();

    public ICollection<PostReport> Reports { get; set; } = new List<PostReport>();

    public ICollection<SavedPost> SavedByUsers { get; set; } = new List<SavedPost>();
}

namespace InteractHub.Api.Domain.Entities;

public class SavedPost
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public Post? Post { get; set; }
}




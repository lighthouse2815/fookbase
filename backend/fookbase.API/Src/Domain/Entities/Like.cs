using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class Like
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid UserId { get; set; }

    public ReactionType Type { get; set; } = ReactionType.LIKE;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Post? Post { get; set; }
}




using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class StoryReaction
{
    public Guid Id { get; set; }

    public Guid StoryId { get; set; }

    public Guid UserId { get; set; }

    public ReactionType Type { get; set; } = ReactionType.LIKE;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Story? Story { get; set; }
}




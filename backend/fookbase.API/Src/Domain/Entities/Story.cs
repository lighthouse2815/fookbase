using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class Story
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string MediaUrl { get; set; } = string.Empty;

    public MediaType MediaType { get; set; } = MediaType.IMAGE;

    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiredAt { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<StoryReaction> Reactions { get; set; } = new List<StoryReaction>();

    public ICollection<StoryView> Views { get; set; } = new List<StoryView>();

    public ICollection<StoryReport> Reports { get; set; } = new List<StoryReport>();
}

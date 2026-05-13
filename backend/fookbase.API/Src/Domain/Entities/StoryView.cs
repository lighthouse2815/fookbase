namespace InteractHub.Api.Domain.Entities;

public class StoryView
{
    public Guid Id { get; set; }

    public Guid StoryId { get; set; }

    public Guid ViewerId { get; set; }

    public DateTime ViewedAt { get; set; }

    public Story? Story { get; set; }
}




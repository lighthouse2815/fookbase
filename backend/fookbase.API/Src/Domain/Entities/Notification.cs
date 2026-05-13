using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid ActorUserId { get; set; }

    public Guid? PostId { get; set; }

    public Guid? CommentId { get; set; }

    public Guid? StoryId { get; set; }

    public NotificationType Type { get; set; }

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }
}




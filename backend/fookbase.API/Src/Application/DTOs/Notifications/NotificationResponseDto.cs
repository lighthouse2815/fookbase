namespace InteractHub.Api.Application.DTOs.Notifications;

public class NotificationResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public Guid ActorUserId { get; init; }

    public Guid? PostId { get; init; }

    public Guid? CommentId { get; init; }

    public string Type { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;

    public bool IsRead { get; init; }

    public DateTime CreatedAt { get; init; }
}
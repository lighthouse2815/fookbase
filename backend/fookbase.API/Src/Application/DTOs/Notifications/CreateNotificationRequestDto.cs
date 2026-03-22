using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Notifications;

public class CreateNotificationRequestDto
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ActorUserId { get; set; }

    public Guid? PostId { get; set; }

    public Guid? CommentId { get; set; }

    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [StringLength(500, MinimumLength = 2)]
    public string Message { get; set; } = string.Empty;
}
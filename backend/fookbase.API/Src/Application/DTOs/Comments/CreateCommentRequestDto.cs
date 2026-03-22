using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Comments;

public class CreateCommentRequestDto
{
    [Required]
    public Guid PostId { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}
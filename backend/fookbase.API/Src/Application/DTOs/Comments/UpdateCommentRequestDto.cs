using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Comments;

public class UpdateCommentRequestDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}
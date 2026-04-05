using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Comments;

public class SetCommentReactionRequestDto
{
    [Required]
    [StringLength(20, MinimumLength = 2)]
    public string Type { get; set; } = string.Empty;
}

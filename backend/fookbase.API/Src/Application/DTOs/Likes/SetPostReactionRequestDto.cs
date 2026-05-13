using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Likes;

public class SetPostReactionRequestDto
{
    [Required]
    [StringLength(20, MinimumLength = 2)]
    public string Type { get; set; } = string.Empty;
}




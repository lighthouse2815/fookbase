using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Posts;

public class CreatePostRequestDto
{
    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [Url]
    [StringLength(500)]
    public string? ImageUrl { get; set; }
}
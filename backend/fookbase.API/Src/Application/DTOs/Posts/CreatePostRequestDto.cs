using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Posts;

public class CreatePostRequestDto
{
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    public IReadOnlyList<string>? ImageUrls { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Posts;

public class SharePostRequestDto
{
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;
}

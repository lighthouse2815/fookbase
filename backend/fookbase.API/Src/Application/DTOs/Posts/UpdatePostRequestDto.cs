using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.Posts;

public class UpdatePostRequestDto
{
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    public IReadOnlyList<string>? ImageUrls { get; set; }

    public PostVisibility? Visibility { get; set; }
}




using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Stories;

public class CreateStoryRequestDto
{
    [Required]
    [StringLength(500)]
    public string MediaUrl { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 3)]
    public string MediaType { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Content { get; set; }
}




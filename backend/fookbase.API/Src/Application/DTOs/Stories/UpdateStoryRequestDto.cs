using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Stories;

public class UpdateStoryRequestDto
{
    [Required]
    [Url]
    [StringLength(500)]
    public string MediaUrl { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiresAt { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Hashtags;

public class CreateHashtagRequestDto
{
    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
}



using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Auth;

public class OtpRequestDto
{
    [Required]
    [EmailAddress]
    [StringLength(255, MinimumLength = 1)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Type { get; set; } = string.Empty;
}

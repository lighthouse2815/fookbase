using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Auth;

public class VerifyOtpRequestDto
{
    [EmailAddress]
    [StringLength(255, MinimumLength = 1)]
    public string? Email { get; set; }

    [Required]
    [StringLength(20, MinimumLength = 1)]
    public string Otp { get; set; } = string.Empty;
}

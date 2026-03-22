using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}

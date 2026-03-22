using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Auth;

public class RegisterRequestDto
{
    [Required]
    [StringLength(50, MinimumLength = 1)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255, MinimumLength = 1)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string FirstName { get; set; } = string.Empty;
}

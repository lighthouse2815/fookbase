using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Auth;

public class ResetPasswordRequestDto
{
    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string NewPassword { get; set; } = string.Empty;
}




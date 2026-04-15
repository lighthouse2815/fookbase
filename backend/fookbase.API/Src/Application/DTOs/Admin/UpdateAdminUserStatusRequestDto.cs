using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Admin;

public class UpdateAdminUserStatusRequestDto
{
    [Required]
    [StringLength(20, MinimumLength = 3)]
    public string Status { get; init; } = string.Empty;
}


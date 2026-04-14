using System.ComponentModel.DataAnnotations;

namespace InteractHub.Api.Application.DTOs.Profiles;

public class UpdateProfileInfoVisibilityRequestDto
{
    [Required]
    public bool? DisplayNameVisible { get; set; }

    [Required]
    public bool? PhoneVisible { get; set; }

    [Required]
    public bool? EmailVisible { get; set; }

    [Required]
    public bool? DateOfBirthVisible { get; set; }

    [Required]
    public bool? GenderVisible { get; set; }

    [Required]
    public bool? FriendCountVisible { get; set; }
}

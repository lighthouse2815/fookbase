namespace InteractHub.Api.Application.DTOs.Profiles;

public class ProfileInfoVisibilityResponseDto
{
    public bool FullNameVisible { get; set; }

    public bool PhoneVisible { get; set; }

    public bool EmailVisible { get; set; }

    public bool DateOfBirthVisible { get; set; }

    public bool GenderVisible { get; set; }

    public bool FriendCountVisible { get; set; }
}

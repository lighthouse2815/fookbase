namespace InteractHub.Api.Application.DTOs.Profiles;

public class ProfilePageInfoSettingsResponseDto
{
    public string DisplayName { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public long FriendCount { get; set; }
}

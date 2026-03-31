namespace InteractHub.Api.Application.DTOs.Profiles;

public class MyProfileSettingsResponseDto
{
    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? AvatarUrl { get; set; }

    public string? BirthDate { get; set; }

    public string? Gender { get; set; }
}

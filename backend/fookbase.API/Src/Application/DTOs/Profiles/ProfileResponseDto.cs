using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Profiles;

public class ProfileResponseDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("friendsCount")]
    public long FriendsCount { get; set; }

    [JsonPropertyName("postsCount")]
    public long PostsCount { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    [JsonPropertyName("fullNameVisible")]
    public bool FullNameVisible { get; set; } = true;

    [JsonPropertyName("phoneVisible")]
    public bool PhoneVisible { get; set; } = true;

    [JsonPropertyName("emailVisible")]
    public bool EmailVisible { get; set; } = true;

    [JsonPropertyName("dateOfBirthVisible")]
    public bool DateOfBirthVisible { get; set; } = true;

    [JsonPropertyName("genderVisible")]
    public bool GenderVisible { get; set; } = true;

    [JsonPropertyName("friendCountVisible")]
    public bool FriendCountVisible { get; set; } = true;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("userStatus")]
    public string? UserStatus { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
}

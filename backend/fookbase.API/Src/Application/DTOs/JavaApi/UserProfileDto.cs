using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class UserProfileDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("friendsCount")]
    public long FriendsCount { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    [JsonPropertyName("fullNameVisible")]
    public bool? FullNameVisible { get; set; }

    [JsonPropertyName("phoneVisible")]
    public bool? PhoneVisible { get; set; }

    [JsonPropertyName("emailVisible")]
    public bool? EmailVisible { get; set; }

    [JsonPropertyName("dateOfBirthVisible")]
    public bool? DateOfBirthVisible { get; set; }

    [JsonPropertyName("genderVisible")]
    public bool? GenderVisible { get; set; }

    [JsonPropertyName("friendCountVisible")]
    public bool? FriendCountVisible { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
}

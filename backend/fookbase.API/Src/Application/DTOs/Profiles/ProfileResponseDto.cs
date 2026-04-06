using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Profiles;

public class ProfileResponseDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("friendsCount")]
    public long FriendsCount { get; set; }

    [JsonPropertyName("postsCount")]
    public long PostsCount { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }
}

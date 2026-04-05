using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Profiles;

public class ProfileResponseDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("bio")]
    public string? Bio { get; set; }

    [JsonPropertyName("coverUrl")]
    public string? CoverUrl { get; set; }

    [JsonPropertyName("major")]
    public string? Major { get; set; }

    [JsonPropertyName("year")]
    public string? Year { get; set; }

    [JsonPropertyName("friendsCount")]
    public int FriendsCount { get; set; }

    [JsonPropertyName("postsCount")]
    public int PostsCount { get; set; }
}

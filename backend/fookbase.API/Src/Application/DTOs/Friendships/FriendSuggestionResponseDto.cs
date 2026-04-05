using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Friendships;

public class FriendSuggestionResponseDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("mutualFriends")]
    public int MutualFriends { get; set; }
}

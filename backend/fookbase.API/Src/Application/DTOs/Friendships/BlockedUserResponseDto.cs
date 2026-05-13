using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Friendships;

public class BlockedUserResponseDto
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;

    [JsonPropertyName("blockedAt")]
    public DateTime? BlockedAt { get; set; }
}




using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class BlockedUserDto
{
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("blockedAt")]
    public DateTime? BlockedAt { get; set; }
}




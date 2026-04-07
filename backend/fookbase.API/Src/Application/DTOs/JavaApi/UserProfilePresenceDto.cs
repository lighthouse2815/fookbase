using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class UserProfilePresenceDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("isOnline")]
    public bool IsOnline { get; set; }

    [JsonPropertyName("lastSeenAt")]
    public string? LastSeenAt { get; set; }
}

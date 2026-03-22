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
}

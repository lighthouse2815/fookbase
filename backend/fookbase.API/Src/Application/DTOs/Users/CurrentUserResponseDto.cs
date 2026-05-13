using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Users;

public class CurrentUserResponseDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("avatarUrl")]
    public string AvatarUrl { get; set; } = string.Empty;
}




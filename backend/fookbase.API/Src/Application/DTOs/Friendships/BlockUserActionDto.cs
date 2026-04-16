using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Friendships;

public class BlockUserActionDto
{
    [JsonPropertyName("targetUserId")]
    public string? TargetUserId { get; set; }

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }
}

using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Friendships;

public class BlockUserActionDto
{
    [JsonPropertyName("targetUserId")]
    public string? TargetUserId { get; set; }
}




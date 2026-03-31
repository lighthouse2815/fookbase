using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class FriendshipResponseDto
{
    [JsonPropertyName("friendshipId")]
    public string? FriendshipId { get; set; }

    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("createdAt")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public string? UpdatedAt { get; set; }
}

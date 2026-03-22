using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class FriendshipDto
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("friendId")]
    public Guid FriendId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

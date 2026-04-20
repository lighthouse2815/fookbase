using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Users;

public class UpdateSecurityAccountRequestDto
{
    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }
}

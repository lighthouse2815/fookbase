using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Users;

public class SecurityAccountInfoResponseDto
{
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }
}




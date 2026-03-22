using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class RegisterResponseDto
{
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class RegisterResponseDto
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}




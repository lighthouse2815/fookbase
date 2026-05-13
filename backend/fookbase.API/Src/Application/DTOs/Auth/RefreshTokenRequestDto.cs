using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class RefreshTokenRequestDto
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }
}




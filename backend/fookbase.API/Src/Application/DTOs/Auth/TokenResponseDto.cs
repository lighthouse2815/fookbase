using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class TokenResponseDto
{
    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("tokenType")]
    public string? TokenType { get; set; }
}




using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class MessageResponseDto
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}




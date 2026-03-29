using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class OtpVerifyResponseDto
{
    [JsonPropertyName("result")]
    public string Result { get; set; } = string.Empty;
}

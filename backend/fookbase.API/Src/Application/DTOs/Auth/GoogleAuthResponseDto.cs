using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class GoogleAuthResponseDto
{
    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("tokenType")]
    public string? TokenType { get; set; }

    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("birthDate")]
    public string? BirthDate { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("profileCompleted")]
    public bool? ProfileCompleted { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("isNew")]
    public bool IsNew { get; set; }
}

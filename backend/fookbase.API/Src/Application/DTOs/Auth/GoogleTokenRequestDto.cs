using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.Auth;

public class GoogleTokenRequestDto
{
    [Required]
    [StringLength(5000, MinimumLength = 1)]
    [JsonPropertyName("tokenId")]
    public string TokenId { get; set; } = string.Empty;
}

using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class UserDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }
}
   

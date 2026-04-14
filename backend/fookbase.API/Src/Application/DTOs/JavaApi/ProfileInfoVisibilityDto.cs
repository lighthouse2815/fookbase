using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class ProfileInfoVisibilityDto
{
    [JsonPropertyName("fullNameVisible")]
    public bool FullNameVisible { get; set; }

    [JsonPropertyName("phoneVisible")]
    public bool PhoneVisible { get; set; }

    [JsonPropertyName("emailVisible")]
    public bool EmailVisible { get; set; }

    [JsonPropertyName("dateOfBirthVisible")]
    public bool DateOfBirthVisible { get; set; }

    [JsonPropertyName("genderVisible")]
    public bool GenderVisible { get; set; }

    [JsonPropertyName("friendCountVisible")]
    public bool FriendCountVisible { get; set; }
}

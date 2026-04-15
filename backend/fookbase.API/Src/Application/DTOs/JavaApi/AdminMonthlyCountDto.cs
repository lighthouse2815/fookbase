using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class AdminMonthlyCountDto
{
    [JsonPropertyName("month")]
    public string? Month { get; set; }

    [JsonPropertyName("count")]
    public long Count { get; set; }
}


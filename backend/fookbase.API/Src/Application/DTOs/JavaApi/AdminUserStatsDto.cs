using System.Text.Json.Serialization;

namespace InteractHub.Api.Application.DTOs.JavaApi;

public class AdminUserStatsDto
{
    [JsonPropertyName("totalUsers")]
    public long TotalUsers { get; set; }

    [JsonPropertyName("activeUsers")]
    public long ActiveUsers { get; set; }

    [JsonPropertyName("bannedUsers")]
    public long BannedUsers { get; set; }

    [JsonPropertyName("inactiveUsers")]
    public long InactiveUsers { get; set; }

    [JsonPropertyName("monthlyCreatedUsers")]
    public List<AdminMonthlyCountDto> MonthlyCreatedUsers { get; set; } = [];
}


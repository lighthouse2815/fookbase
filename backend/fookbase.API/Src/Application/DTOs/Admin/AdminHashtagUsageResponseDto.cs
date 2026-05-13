namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminHashtagUsageResponseDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public int UsageCount { get; init; }

    public DateTime CreatedAt { get; init; }
}

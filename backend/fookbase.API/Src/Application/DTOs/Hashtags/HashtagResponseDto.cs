namespace InteractHub.Api.Application.DTOs.Hashtags;

public class HashtagResponseDto
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public int UsageCount { get; init; }

    public DateTime CreatedAt { get; init; }
}




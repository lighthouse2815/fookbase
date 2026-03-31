namespace InteractHub.Api.Application.DTOs.Stories;

public class StoryUploadResponseDto
{
    public string MediaUrl { get; init; } = string.Empty;

    public string MediaType { get; init; } = string.Empty;

    public long SizeBytes { get; init; }
}

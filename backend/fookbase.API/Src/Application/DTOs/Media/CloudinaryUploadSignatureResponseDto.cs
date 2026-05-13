namespace InteractHub.Api.Application.DTOs.Media;

public class CloudinaryUploadSignatureResponseDto
{
    public string CloudName { get; init; } = string.Empty;

    public string ApiKey { get; init; } = string.Empty;

    public string UploadPreset { get; init; } = string.Empty;

    public string Folder { get; init; } = string.Empty;

    public string PublicId { get; init; } = string.Empty;

    public bool Overwrite { get; init; }

    public long Timestamp { get; init; }

    public string Signature { get; init; } = string.Empty;
}




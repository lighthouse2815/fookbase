namespace InteractHub.Api.Application.DTOs.Common;

/// <summary>
/// Marker type for successful operations that intentionally return HTTP 204.
/// </summary>
public sealed class NoContentDto
{
    public static NoContentDto Instance { get; } = new();

    private NoContentDto()
    {
    }
}

namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminUserSearchResponseDto
{
    public Guid UserId { get; init; }

    public string Username { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string? AvatarUrl { get; init; }

    public string? Email { get; init; }

    public string? PhoneNumber { get; init; }

    public string Role { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public DateTime? CreatedAt { get; init; }

    public DateTime? UpdatedAt { get; init; }
}





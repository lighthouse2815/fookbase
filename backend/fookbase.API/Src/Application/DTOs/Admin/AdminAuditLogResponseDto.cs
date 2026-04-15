namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminAuditLogResponseDto
{
    public Guid Id { get; init; }

    public Guid AdminUserId { get; init; }

    public string ActionType { get; init; } = string.Empty;

    public string EntityType { get; init; } = string.Empty;

    public Guid? EntityId { get; init; }

    public Guid? TargetUserId { get; init; }

    public string? Details { get; init; }

    public DateTime CreatedAt { get; init; }
}


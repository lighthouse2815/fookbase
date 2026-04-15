namespace InteractHub.Api.Domain.Entities;

public class AdminAuditLog
{
    public Guid Id { get; set; }

    public Guid AdminUserId { get; set; }

    public string ActionType { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public Guid? EntityId { get; set; }

    public Guid? TargetUserId { get; set; }

    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; }
}


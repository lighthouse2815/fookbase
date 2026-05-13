using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class AdminAuditLog
{
    public Guid Id { get; set; }

    public Guid AdminUserId { get; set; }

    public AdminAuditActionType ActionType { get; set; }

    public AdminAuditEntityType EntityType { get; set; }

    public Guid EntityId { get; set; }

    public Guid TargetUserId { get; set; }

    public string Details { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}




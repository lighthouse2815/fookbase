using InteractHub.Api.Domain.Enums;
using InteractHub.Api.Application.DTOs.Common;

namespace InteractHub.Api.Application.DTOs.Admin;

public class AdminAuditLogResponseDto
{
    public Guid Id { get; init; }

    public Guid AdminUserId { get; init; }

    public AdminAuditActionType ActionType { get; init; }

    public AdminAuditEntityType EntityType { get; init; }

    public Guid EntityId { get; init; }

    public Guid TargetUserId { get; init; }

    public string Details { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }

    public AuthorSummaryDto? Admin { get; init; }

    public AuthorSummaryDto? TargetUser { get; init; }
}





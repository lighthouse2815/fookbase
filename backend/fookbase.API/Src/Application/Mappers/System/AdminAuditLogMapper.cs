using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class AdminAuditLogMapper
{
    public static AdminAuditLogResponseDto ToResponseDto(this AdminAuditLog log)
    {
        ArgumentNullException.ThrowIfNull(log);

        return new AdminAuditLogResponseDto
        {
            Id = log.Id,
            AdminUserId = log.AdminUserId,
            ActionType = log.ActionType,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            TargetUserId = log.TargetUserId,
            Details = log.Details,
            CreatedAt = log.CreatedAt
        };
    }
}




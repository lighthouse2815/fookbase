using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.PostReports;

public class PostReportResponseDto
{
    public Guid Id { get; init; }

    public Guid PostId { get; init; }

    public Guid ReportedByUserId { get; init; }

    public Guid? PostOwnerUserId { get; init; }

    public string Reason { get; init; } = string.Empty;

    public ReportStatus Status { get; init; }

    public Guid? ResolvedByUserId { get; init; }

    public DateTime? ResolvedAt { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public AuthorSummaryDto? Reporter { get; init; }

    public AuthorSummaryDto? PostOwner { get; init; }
}




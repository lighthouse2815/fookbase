using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.DTOs.StoryReports;

public class StoryReportResponseDto
{
    public Guid Id { get; init; }

    public Guid StoryId { get; init; }

    public Guid? StoryOwnerUserId { get; init; }

    public Guid ReportedByUserId { get; init; }

    public string Reason { get; init; } = string.Empty;

    public ReportStatus Status { get; init; }

    public Guid? ResolvedByUserId { get; init; }

    public DateTime? ResolvedAt { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public AuthorSummaryDto? Reporter { get; init; }

    public AuthorSummaryDto? StoryOwner { get; init; }
}




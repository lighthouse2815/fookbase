using InteractHub.Api.Application.DTOs.Common;

namespace InteractHub.Api.Application.DTOs.CommentReports;

public class CommentReportResponseDto
{
    public Guid Id { get; init; }

    public Guid CommentId { get; init; }

    public Guid PostId { get; init; }

    public Guid ReportedByUserId { get; init; }

    public Guid? CommentOwnerUserId { get; init; }

    public string Reason { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public Guid? ResolvedByUserId { get; init; }

    public DateTime? ResolvedAt { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }

    public AuthorSummaryDto? Reporter { get; init; }

    public AuthorSummaryDto? CommentOwner { get; init; }
}

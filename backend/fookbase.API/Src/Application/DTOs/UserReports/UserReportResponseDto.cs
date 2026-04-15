namespace InteractHub.Api.Application.DTOs.UserReports;

public class UserReportResponseDto
{
    public Guid Id { get; init; }

    public Guid TargetUserId { get; init; }

    public Guid ReportedByUserId { get; init; }

    public string Reason { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public Guid? ResolvedByUserId { get; init; }

    public DateTime? ResolvedAt { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }
}

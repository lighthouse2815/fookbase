using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Domain.Entities;

public class CommentReport
{
    public Guid Id { get; set; }

    public Guid CommentId { get; set; }

    public Guid PostId { get; set; }

    public Guid ReportedByUserId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public ReportStatus Status { get; set; } = ReportStatus.PENDING;

    public Guid? ResolvedByUserId { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Comment? Comment { get; set; }
}

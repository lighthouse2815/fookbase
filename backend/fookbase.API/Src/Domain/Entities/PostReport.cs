namespace InteractHub.Api.Domain.Entities;

public class PostReport
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid ReportedByUserId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = "PENDING";

    public Guid? ResolvedByUserId { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public Post? Post { get; set; }
}

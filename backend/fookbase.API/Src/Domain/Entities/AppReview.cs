namespace InteractHub.Api.Domain.Entities;

public class AppReview
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public bool IsHidden { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

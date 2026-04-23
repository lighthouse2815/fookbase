namespace InteractHub.Api.Application.DTOs.AppReviews;

public class AppReviewResponseDto
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public int Rating { get; init; }

    public string Comment { get; init; } = string.Empty;

    public bool IsHidden { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }
}

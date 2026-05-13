namespace InteractHub.Api.Application.DTOs.AppReviews;

public class AppReviewSummaryResponseDto
{
    public double AverageRating { get; init; }

    public int TotalReviews { get; init; }

    public int FiveStarCount { get; init; }

    public int FourStarCount { get; init; }

    public int ThreeStarCount { get; init; }

    public int TwoStarCount { get; init; }

    public int OneStarCount { get; init; }
}




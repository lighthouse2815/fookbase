using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class AppReviewMapper
{
    public static AppReviewSummaryResponseDto ToSummaryResponseDto(
        IReadOnlyDictionary<int, int> distribution,
        double average,
        int totalCount)
    {
        ArgumentNullException.ThrowIfNull(distribution);

        return new AppReviewSummaryResponseDto
        {
            AverageRating = Math.Round(average, 1, MidpointRounding.AwayFromZero),
            TotalReviews = totalCount,
            FiveStarCount = distribution.TryGetValue(5, out var fiveStarCount) ? fiveStarCount : 0,
            FourStarCount = distribution.TryGetValue(4, out var fourStarCount) ? fourStarCount : 0,
            ThreeStarCount = distribution.TryGetValue(3, out var threeStarCount) ? threeStarCount : 0,
            TwoStarCount = distribution.TryGetValue(2, out var twoStarCount) ? twoStarCount : 0,
            OneStarCount = distribution.TryGetValue(1, out var oneStarCount) ? oneStarCount : 0
        };
    }

    public static AppReviewResponseDto ToResponseDto(this AppReview review)
    {
        ArgumentNullException.ThrowIfNull(review);

        return new AppReviewResponseDto
        {
            Id = review.Id,
            UserId = review.UserId,
            DisplayName = review.DisplayName,
            Rating = review.Rating,
            Comment = review.Comment,
            IsHidden = review.IsHidden,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }

    public static PublicAppReviewResponseDto ToPublicResponseDto(this AppReview review)
    {
        ArgumentNullException.ThrowIfNull(review);

        return new PublicAppReviewResponseDto
        {
            Id = review.Id,
            DisplayName = review.DisplayName,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }
}




using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Extensions;

namespace InteractHub.Api.Application.Validators;

public static class AppReviewValidator
{
    private const int MinRating = 1;
    private const int MaxRating = 5;
    private const int MinDisplayNameLength = 2;
    private const int MaxDisplayNameLength = 80;
    private const int MinCommentLength = 3;
    private const int MaxCommentLength = 1000;

    public static void ValidateOptionalRating(int? rating)
    {
        if (!rating.HasValue)
        {
            return;
        }

        ValidateRating(rating.Value);
    }

    public static int ValidateRating(int rating)
    {
        if (rating < MinRating || rating > MaxRating)
        {
            throw new BusinessException(ErrorCode.APP_REVIEW_RATING_INVALID);
        }

        return rating;
    }

    public static string NormalizeDisplayName(string? displayName)
    {
        var normalized = displayName.TrimToNull()
            ?? throw new BusinessException(ErrorCode.DISPLAY_NAME_REQUIRED);

        if (normalized.Length < MinDisplayNameLength || normalized.Length > MaxDisplayNameLength)
        {
            throw new BusinessException(ErrorCode.DISPLAY_NAME_LENGTH_INVALID);
        }

        return normalized;
    }

    public static string NormalizeComment(string? comment)
    {
        var normalized = comment.TrimToNull()
            ?? throw new BusinessException(ErrorCode.COMMENT_REQUIRED);

        if (normalized.Length < MinCommentLength || normalized.Length > MaxCommentLength)
        {
            throw new BusinessException(ErrorCode.COMMENT_LENGTH_INVALID);
        }

        return normalized;
    }
}




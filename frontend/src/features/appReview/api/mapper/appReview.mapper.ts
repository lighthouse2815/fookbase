import type {
  AppReviewResponseDto,
  AppReviewSummaryResponseDto,
  PublicAppReviewResponseDto,
} from '@/features/appReview/api/dtos/response.dto';
import type {
  AppReview,
  AppReviewSummary,
  PublicAppReview,
} from '@/features/appReview/types/contracts';

export const mapAppReviewResponseDto = (payload: AppReviewResponseDto): AppReview => {
  return {
    id: payload.id,
    userId: payload.userId,
    displayName: payload.displayName,
    rating: payload.rating,
    comment: payload.comment,
    isHidden: payload.isHidden,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
};

export const mapPublicAppReviewResponseDto = (payload: PublicAppReviewResponseDto): PublicAppReview => {
  return {
    id: payload.id,
    displayName: payload.displayName,
    rating: payload.rating,
    comment: payload.comment,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
};

export const mapAppReviewSummaryResponseDto = (payload: AppReviewSummaryResponseDto): AppReviewSummary => {
  return {
    averageRating: Number(payload.averageRating ?? 0),
    totalReviews: Number(payload.totalReviews ?? 0),
    fiveStarCount: Number(payload.fiveStarCount ?? 0),
    fourStarCount: Number(payload.fourStarCount ?? 0),
    threeStarCount: Number(payload.threeStarCount ?? 0),
    twoStarCount: Number(payload.twoStarCount ?? 0),
    oneStarCount: Number(payload.oneStarCount ?? 0),
  };
};

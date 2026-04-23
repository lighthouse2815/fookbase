export interface AppReview {
  id: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAppReview {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppReviewSummary {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

export interface CreateOrUpdateAppReviewPayload {
  rating: number;
  displayName: string;
  comment: string;
}

export interface AppReviewListParams {
  page?: number;
  pageSize?: number;
  rating?: number | null;
}

export interface AdminAppReviewFilters {
  rating?: number | null;
  isHidden?: boolean | null;
}

export type AdminAppReviewItem = AppReview;

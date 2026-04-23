export interface AppReviewResponseDto {
  id: string;
  userId: string;
  displayName: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAppReviewResponseDto {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppReviewSummaryResponseDto {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
}

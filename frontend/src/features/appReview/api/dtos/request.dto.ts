export interface CreateOrUpdateAppReviewRequestDto {
  rating: number;
  displayName: string;
  comment: string;
}

export interface UpdateAppReviewVisibilityRequestDto {
  isHidden: boolean;
}

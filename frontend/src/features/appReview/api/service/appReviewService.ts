import axios from 'axios';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData, mapPaged } from '@/shared/api/httpResponse';
import type { ApiEnvelope, PagedResult, PaginatedResult } from '@/shared/types/api';
import type { CreateOrUpdateAppReviewRequestDto } from '@/features/appReview/api/dtos/request.dto';
import type {
  AppReviewResponseDto,
  AppReviewSummaryResponseDto,
  PublicAppReviewResponseDto,
} from '@/features/appReview/api/dtos/response.dto';
import {
  mapAppReviewResponseDto,
  mapAppReviewSummaryResponseDto,
  mapPublicAppReviewResponseDto,
} from '@/features/appReview/api/mapper/appReview.mapper';
import type {
  AdminAppReviewFilters,
  AppReview,
  AppReviewSummary,
  CreateOrUpdateAppReviewPayload,
  PublicAppReview,
} from '@/features/appReview/types/contracts';

const { APP_REVIEWS } = API_ENDPOINTS;

const mapCreateOrUpdatePayload = (
  payload: CreateOrUpdateAppReviewPayload,
): CreateOrUpdateAppReviewRequestDto => ({
  rating: payload.rating,
  displayName: payload.displayName,
  comment: payload.comment,
});

export const appReviewService = {
  async getPublicReviews(
    page: number,
    pageSize: number,
    rating?: number | null,
  ): Promise<PaginatedResult<PublicAppReview>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PublicAppReviewResponseDto>>>(APP_REVIEWS.PUBLIC, {
      params: {
        page,
        pageSize,
        rating: rating ?? undefined,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load app reviews'));
    return {
      ...paged,
      items: paged.items.map(mapPublicAppReviewResponseDto),
    };
  },

  async getReviewSummary(): Promise<AppReviewSummary> {
    const response = await apiClient.get<ApiEnvelope<AppReviewSummaryResponseDto>>(APP_REVIEWS.SUMMARY);
    const payload = extractData(response.data, 'Failed to load review summary');
    return mapAppReviewSummaryResponseDto(payload);
  },

  async getMyReview(): Promise<AppReview | null> {
    try {
      const response = await apiClient.get<ApiEnvelope<AppReviewResponseDto | null>>(APP_REVIEWS.ME);
      const payload = extractData(response.data, 'Failed to load your review');
      if (!payload) {
        return null;
      }

      return mapAppReviewResponseDto(payload);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },

  async createOrUpdateMyReview(payload: CreateOrUpdateAppReviewPayload): Promise<AppReview> {
    const response = await apiClient.post<ApiEnvelope<AppReviewResponseDto>>(
      APP_REVIEWS.CREATE,
      mapCreateOrUpdatePayload(payload),
    );
    return mapAppReviewResponseDto(extractData(response.data, 'Failed to save your review'));
  },

  async updateMyReview(payload: CreateOrUpdateAppReviewPayload): Promise<AppReview> {
    const response = await apiClient.put<ApiEnvelope<AppReviewResponseDto>>(
      APP_REVIEWS.UPDATE_ME,
      mapCreateOrUpdatePayload(payload),
    );
    return mapAppReviewResponseDto(extractData(response.data, 'Failed to update your review'));
  },

  async deleteMyReview(): Promise<void> {
    await apiClient.delete<ApiEnvelope<object>>(APP_REVIEWS.DELETE_ME);
  },

  async getAdminReviews(
    page: number,
    pageSize: number,
    filters: AdminAppReviewFilters,
  ): Promise<PaginatedResult<AppReview>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<AppReviewResponseDto>>>(APP_REVIEWS.ADMIN_LIST, {
      params: {
        page,
        pageSize,
        rating: filters.rating ?? undefined,
        isHidden: filters.isHidden ?? undefined,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load admin app reviews'));
    return {
      ...paged,
      items: paged.items.map(mapAppReviewResponseDto),
    };
  },

  async hideAdminReview(reviewId: string): Promise<AppReview> {
    const response = await apiClient.patch<ApiEnvelope<AppReviewResponseDto>>(APP_REVIEWS.ADMIN_HIDE(reviewId));
    return mapAppReviewResponseDto(extractData(response.data, 'Failed to hide app review'));
  },

  async unhideAdminReview(reviewId: string): Promise<AppReview> {
    const response = await apiClient.patch<ApiEnvelope<AppReviewResponseDto>>(APP_REVIEWS.ADMIN_UNHIDE(reviewId));
    return mapAppReviewResponseDto(extractData(response.data, 'Failed to unhide app review'));
  },

  async deleteAdminReview(reviewId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<object>>(APP_REVIEWS.ADMIN_DELETE(reviewId));
  },
};

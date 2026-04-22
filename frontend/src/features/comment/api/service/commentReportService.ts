import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData, mapPaged } from '@/shared/api/httpResponse';
import type {
  CreateCommentReportRequestDto,
  ResolveCommentReportRequestDto,
} from '@/features/comment/api/dtos/request.dto';
import type {
  CommentReportResponseDto,
  PendingCountResponseDto,
} from '@/features/comment/api/dtos/response.dto';
import {
  mapCommentReportResponseDto,
  mapPendingCountResponseDto,
} from '@/features/comment/api/mapper/mapper';
import type { PagedResult, ApiEnvelope, PaginatedResult } from '@/shared/types/api';
import type { CommentReportItem, CommentReportStatus } from '@/features/comment/types/contracts';

const { COMMENT_REPORTS } = API_ENDPOINTS;

export const commentReportService = {
  async create(commentId: string, reason: string): Promise<CommentReportItem> {
    const payload: CreateCommentReportRequestDto = {
      commentId,
      reason,
    };
    const response = await apiClient.post<ApiEnvelope<CommentReportResponseDto>>(COMMENT_REPORTS.CREATE, payload);

    return mapCommentReportResponseDto(extractData(response.data, 'Failed to report comment'));
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<CommentReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentReportResponseDto>>>(COMMENT_REPORTS.MY, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load comment reports'));
    return {
      ...paged,
      items: paged.items.map(mapCommentReportResponseDto),
    };
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<CommentReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentReportResponseDto>>>(COMMENT_REPORTS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load comment reports'));
    return {
      ...paged,
      items: paged.items.map(mapCommentReportResponseDto),
    };
  },

  async resolve(reportId: string, status: CommentReportStatus): Promise<CommentReportItem> {
    const payload: ResolveCommentReportRequestDto = {
      status,
    };
    const response = await apiClient.patch<ApiEnvelope<CommentReportResponseDto>>(
      COMMENT_REPORTS.RESOLVE(reportId),
      payload,
    );

    return mapCommentReportResponseDto(extractData(response.data, 'Failed to resolve comment report'));
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountResponseDto>>(COMMENT_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending comment report count');
    return mapPendingCountResponseDto(payload);
  },
};


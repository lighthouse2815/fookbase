import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData, mapPaged } from '@/shared/api/httpResponse';
import type { CreatePostReportRequestDto, ResolvePostReportRequestDto } from '@/features/admin/api/dtos/request.dto';
import type {
  PendingCountResponseDto,
  PostReportResponseDto,
} from '@/features/admin/api/dtos/response.dto';
import {
  mapPendingCountResponseDto,
  mapPostReportResponseDto,
} from '@/features/admin/api/mapper/admin.mapper';
import type { PostReportItem, PostReportStatus } from '@/features/admin/types/report';
import type { PagedResult, ApiEnvelope, PaginatedResult } from '@/shared/types/api';

const { POST_REPORTS } = API_ENDPOINTS;

export const postReportService = {
  async create(postId: string, reason: string): Promise<PostReportItem> {
    const response = await apiClient.post<ApiEnvelope<PostReportResponseDto>>(POST_REPORTS.CREATE, {
      postId,
      reason,
    } satisfies CreatePostReportRequestDto);

    return mapPostReportResponseDto(extractData(response.data, 'Failed to report post'));
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<PostReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportResponseDto>>>(POST_REPORTS.MY, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load reported posts'));
    return {
      ...paged,
      items: paged.items.map(mapPostReportResponseDto),
    };
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<PostReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportResponseDto>>>(POST_REPORTS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = mapPaged(extractData(response.data, 'Failed to load reports'));
    return {
      ...paged,
      items: paged.items.map(mapPostReportResponseDto),
    };
  },

  async resolve(reportId: string, status: PostReportStatus): Promise<PostReportItem> {
    const response = await apiClient.patch<ApiEnvelope<PostReportResponseDto>>(POST_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolvePostReportRequestDto);

    return mapPostReportResponseDto(extractData(response.data, 'Failed to resolve report'));
  },

  async remove(reportId: string): Promise<void> {
    await apiClient.delete(POST_REPORTS.BY_ID(reportId));
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountResponseDto>>(POST_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending report count');
    return mapPendingCountResponseDto(payload);
  },
};




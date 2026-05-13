import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData, mapPaged } from '@/shared/api/httpResponse';
import type { CreateStoryReportRequestDto, ResolveStoryReportRequestDto } from '@/features/admin/api/dtos/request.dto';
import type {
  PendingCountResponseDto,
  StoryReportResponseDto,
} from '@/features/admin/api/dtos/response.dto';
import {
  mapPendingCountResponseDto,
  mapStoryReportResponseDto,
} from '@/features/admin/api/mapper/admin.mapper';
import type { ResolveStoryReportStatus, StoryReportItem } from '@/features/admin/types/report';
import type { ApiEnvelope, PagedResult, PaginatedResult } from '@/shared/types/api';

const { STORY_REPORTS } = API_ENDPOINTS;

export const storyReportService = {
  async create(storyId: string, reason: string): Promise<StoryReportItem> {
    const response = await apiClient.post<ApiEnvelope<StoryReportResponseDto>>(STORY_REPORTS.CREATE, {
      storyId,
      reason,
    } satisfies CreateStoryReportRequestDto);
    return mapStoryReportResponseDto(extractData(response.data, 'Failed to report story'));
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<StoryReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportResponseDto>>>(STORY_REPORTS.MY, {
      params: { page, pageSize },
    });
    const paged = mapPaged(extractData(response.data, 'Failed to load story reports'));
    return {
      ...paged,
      items: paged.items.map(mapStoryReportResponseDto),
    };
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<StoryReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportResponseDto>>>(STORY_REPORTS.LIST, {
      params: { page, pageSize },
    });
    const paged = mapPaged(extractData(response.data, 'Failed to load story reports'));
    return {
      ...paged,
      items: paged.items.map(mapStoryReportResponseDto),
    };
  },

  async resolve(reportId: string, status: ResolveStoryReportStatus): Promise<StoryReportItem> {
    const response = await apiClient.patch<ApiEnvelope<StoryReportResponseDto>>(STORY_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolveStoryReportRequestDto);
    return mapStoryReportResponseDto(extractData(response.data, 'Failed to resolve story report'));
  },

  async remove(reportId: string): Promise<void> {
    await apiClient.delete(STORY_REPORTS.BY_ID(reportId));
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountResponseDto>>(STORY_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending story report count');
    return mapPendingCountResponseDto(payload);
  },
};




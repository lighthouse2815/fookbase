import type { ApiEnvelope, DataEnvelope, PagedResult, PaginatedResult } from '@/shared/types/api';

export const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!('data' in response) || response.data === undefined) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

export const extractEnvelopeData = <T>(payload: T | DataEnvelope<T>): T => {
  const envelope = payload as DataEnvelope<T>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope && envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
};

export const mapPaged = <T>(paged: PagedResult<T>): PaginatedResult<T> => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    totalCount: paged.totalCount,
    hasMore: loadedCount < paged.totalCount,
  };
};



import axios from 'axios';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient, javaApiClient } from '@/shared/api/apiClient';
import type { ApiEnvelope } from '@/shared/types/api';
import type { PendingRequesterResponseDto } from '@/features/friendship/api/dtos/response.dto';

const FW = API_ENDPOINTS.FRIENDSHIPS;

export interface FriendshipRequestCandidate {
  method: 'get' | 'post' | 'delete';
  path: string;
  data?: unknown;
  client?: 'csharp' | 'java';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractFriendshipEnvelopeData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (!isRecord(payload)) {
    return payload as T;
  }

  if ('data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  if ('result' in payload && payload.result !== undefined) {
    const candidate = payload.result;
    if (Array.isArray(candidate) || isRecord(candidate)) {
      return candidate as T;
    }
  }

  return payload as T;
};

export const requestFromCandidates = async <T>(candidates: FriendshipRequestCandidate[]): Promise<T> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const client = candidate.client === 'java' ? javaApiClient : apiClient;
      const response = await client.request<T | ApiEnvelope<T>>({
        method: candidate.method,
        url: candidate.path,
        data: candidate.data,
      });
      return extractFriendshipEnvelopeData<T>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          throw error;
        }
      }

      lastError = error;
    }
  }

  throw lastError ?? new Error('No matching friendship endpoint responded successfully.');
};

let pendingRequestersPromise: Promise<PendingRequesterResponseDto[]> | null = null;

export const getPendingRequestersFromJava = async (): Promise<PendingRequesterResponseDto[]> => {
  if (!pendingRequestersPromise) {
    pendingRequestersPromise = requestFromCandidates<PendingRequesterResponseDto[]>([
      { method: 'get', path: FW.PENDING_REQUESTERS },
    ]);
  }

  try {
    return await pendingRequestersPromise;
  } finally {
    pendingRequestersPromise = null;
  }
};

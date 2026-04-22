import axios, { type AxiosInstance } from 'axios';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { RetriableRequestConfig } from '@/shared/api/types';
import { storage } from '@/shared/storage/storage';

const AUTH_SKIP_REFRESH_ENDPOINTS = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.ADMIN_LOGIN,
  API_ENDPOINTS.AUTH.REFRESH_TOKEN,
  API_ENDPOINTS.AUTH.LOGOUT,
];

const normalizePathname = (value: string): string => {
  const pathWithoutQueryOrHash = value.split('?')[0]?.split('#')[0] ?? value;
  const withLeadingSlash = pathWithoutQueryOrHash.startsWith('/')
    ? pathWithoutQueryOrHash
    : `/${pathWithoutQueryOrHash}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');

  return (withoutTrailingSlash || '/').toLowerCase();
};

const AUTH_SKIP_REFRESH_PATHS = AUTH_SKIP_REFRESH_ENDPOINTS.map(normalizePathname);

const tryParsePathname = (requestUrl: string, baseURL?: string): string | null => {
  try {
    return normalizePathname(new URL(requestUrl).pathname);
  } catch {
    // Falls through to parse relative URLs below.
  }

  if (baseURL) {
    try {
      return normalizePathname(new URL(requestUrl, baseURL).pathname);
    } catch {
      // Falls through to plain string normalization.
    }
  }

  return null;
};

const shouldSkipRefresh = (requestConfig: RetriableRequestConfig | undefined): boolean => {
  if (!requestConfig) {
    return true;
  }

  const requestUrl = requestConfig.url;
  if (!requestUrl) {
    return true;
  }

  const requestPath =
    tryParsePathname(requestUrl, requestConfig.baseURL) ?? normalizePathname(requestUrl);

  return AUTH_SKIP_REFRESH_PATHS.includes(requestPath);
};

export const applyAuthRefreshInterceptor = (
  client: AxiosInstance,
  refreshAccessToken: () => Promise<string | null>,
): void => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as RetriableRequestConfig | undefined;
      const statusCode = error.response?.status;

      if (
        statusCode !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        shouldSkipRefresh(originalRequest) ||
        !storage.getToken()
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshedAccessToken = await refreshAccessToken();
      if (!refreshedAccessToken) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;

      return client.request(originalRequest);
    },
  );
};


import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { STORAGE_KEYS, storage } from '../utils/storage';

const csharpBaseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7000';
const javaBaseURL = import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080';

interface ApiEnvelope<T> {
  data?: T;
}

interface TokenPayload {
  token?: string;
  accessToken?: string;
  jwt?: string;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshAccessTokenPromise: Promise<string | null> | null = null;

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = storage.getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const extractEnvelopeData = <T>(payload: T | ApiEnvelope<T>): T => {
  const envelope = payload as ApiEnvelope<T>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope && envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
};

const normalizeToken = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  const normalized = token.replace(/^Bearer\s+/i, '').trim();
  return normalized || undefined;
};

const clearSessionAndRedirect = () => {
  storage.clearToken();
  storage.clearUser();
  storage.clearProfileCompletionRequired();
  localStorage.removeItem(STORAGE_KEYS.rememberMe);

  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/admin/login') {
    window.location.assign('/login');
  }
};

const shouldSkipRefresh = (requestConfig: RetriableRequestConfig | undefined): boolean => {
  if (!requestConfig) {
    return true;
  }

  const combinedUrl = `${requestConfig.baseURL ?? ''}${requestConfig.url ?? ''}`.toLowerCase();

  return (
    combinedUrl.includes('/api/auth/login') ||
    combinedUrl.includes('/api/auth/admin/login') ||
    combinedUrl.includes('/api/auth/refresh-token') ||
    combinedUrl.includes('/api/auth/logout')
  );
};

const refreshAuthClient = axios.create({
  baseURL: csharpBaseURL,
  timeout: 10000,
  withCredentials: true,
});

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = refreshAuthClient
      .post<TokenPayload | ApiEnvelope<TokenPayload>>('/api/auth/refresh-token')
      .then((response) => {
        const payload = extractEnvelopeData(response.data);
        const token = normalizeToken(payload.accessToken ?? payload.token ?? payload.jwt);
        if (!token) {
          return null;
        }

        storage.setToken(token);
        return token;
      })
      .catch(() => {
        clearSessionAndRedirect();
        return null;
      })
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
};

const applyAuthRefreshInterceptor = (client: AxiosInstance) => {
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

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

export const javaApiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL ?? 'https://interacthub-api-java-fxdbf3fegqhrb3fz.japanwest-01.azurewebsites.net',
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(attachAuthHeader);
javaApiClient.interceptors.request.use(attachAuthHeader);
applyAuthRefreshInterceptor(apiClient);
applyAuthRefreshInterceptor(javaApiClient);

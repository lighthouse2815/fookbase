import type { InternalAxiosRequestConfig } from 'axios';

export interface TokenPayload {
  token?: string;
  accessToken?: string;
  jwt?: string;
}

export type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export interface CreateHttpClientInput {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
}

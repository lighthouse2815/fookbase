import type { InternalAxiosRequestConfig } from 'axios';

import { storage } from '@/shared/storage/storage';

export const attachAuthHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = storage.getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};


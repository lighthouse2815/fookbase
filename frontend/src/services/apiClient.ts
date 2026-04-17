import axios, { type InternalAxiosRequestConfig } from 'axios';

import { API_CONFIG } from '@/config/apiConfig';
import { storage } from '@/utils/storage';

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = storage.getToken();
  const cachedUser = storage.getUser<{ id?: string }>();
  const userId = cachedUser?.id;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (userId) {
    config.headers = config.headers ?? {};
    config.headers['X-User-Id'] = userId;
  }

  return config;
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

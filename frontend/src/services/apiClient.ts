import axios, { type InternalAxiosRequestConfig } from 'axios';

import { storage } from '../utils/storage';

const csharpBaseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:65104';
const javaBaseURL = import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080';


const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = storage.getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

export const apiClient = axios.create({
  baseURL: csharpBaseURL,
  timeout: 10000,
  withCredentials: true,
});

export const javaApiClient = axios.create({
  baseURL: javaBaseURL,
  timeout: 10000,
  withCredentials: true,
});

javaApiClient.interceptors.request.use(attachAuthHeader);

import axios, { type AxiosInstance } from 'axios';
import type { CreateHttpClientInput } from '@/shared/api/types';

export const createHttpClient = ({
  baseURL,
  timeout = 10000,
  withCredentials = true,
}: CreateHttpClientInput): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout,
    withCredentials,
  });
};

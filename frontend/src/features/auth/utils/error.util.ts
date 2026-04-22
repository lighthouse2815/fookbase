import axios from 'axios';

type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: string[];
};

export interface AuthApiErrorInfo {
  status?: number;
  message?: string;
}

export const extractAuthApiErrorInfo = (error: unknown): AuthApiErrorInfo => {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const payload = error.response?.data as ApiErrorPayload | undefined;
  const message = payload?.errors?.find(Boolean) ?? payload?.message ?? payload?.error;

  return {
    status: error.response?.status,
    message,
  };
};

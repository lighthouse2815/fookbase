import axios from 'axios';

type ApiErrorPayload = {
  message?: string;
  error?:
    | string
    | {
        message?: string;
        code?: string;
      };
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
  const apiErrorMessage = typeof payload?.error === 'string' ? payload.error : payload?.error?.message;
  const message = payload?.message ?? apiErrorMessage;

  return {
    status: error.response?.status,
    message,
  };
};

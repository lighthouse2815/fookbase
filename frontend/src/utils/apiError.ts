import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string; error?: string } | undefined)?.message ??
      (error.response?.data as { message?: string; error?: string } | undefined)?.error;

    return message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};


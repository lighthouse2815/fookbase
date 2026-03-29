import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          message?: string;
          error?: string;
          errors?: string[];
        }
      | undefined;
    const message = payload?.message ?? payload?.error ?? payload?.errors?.find(Boolean);

    return message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};


import axios from 'axios';

export const getApiErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          message?: string;
          error?:
            | string
            | {
                message?: string;
                code?: string;
              };
        }
      | undefined;
    const apiErrorMessage = typeof payload?.error === 'string' ? payload.error : payload?.error?.message;
    const message = payload?.message ?? apiErrorMessage;

    return message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};


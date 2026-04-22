import type { AxiosInstance } from 'axios';

import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { extractEnvelopeData } from '@/shared/api/httpResponse';
import type { TokenPayload } from '@/shared/api/types';
import type { DataEnvelope } from '@/shared/types/api';
import { storage } from '@/shared/storage/storage';

import { clearSessionAndRedirectToLogin, normalizeBearerToken } from './session';

export const createRefreshAccessToken = (
  refreshAuthClient: AxiosInstance,
): (() => Promise<string | null>) => {
  let refreshAccessTokenPromise: Promise<string | null> | null = null;

  return async () => {
    if (!refreshAccessTokenPromise) {
      refreshAccessTokenPromise = refreshAuthClient
        .post<TokenPayload | DataEnvelope<TokenPayload>>(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
        .then((response) => {
          const payload = extractEnvelopeData(response.data);
          const token = normalizeBearerToken(payload.accessToken ?? payload.token ?? payload.jwt);

          if (!token) {
            return null;
          }

          storage.setToken(token);
          return token;
        })
        .catch(() => {
          clearSessionAndRedirectToLogin();
          return null;
        })
        .finally(() => {
          refreshAccessTokenPromise = null;
        });
    }

    return refreshAccessTokenPromise;
  };
};


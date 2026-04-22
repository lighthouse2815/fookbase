import { createRefreshAccessToken } from '@/shared/api/auth/refreshToken';
import { createHttpClient } from '@/shared/api/httpClient';
import { applyAuthRefreshInterceptor } from '@/shared/api/interceptors/authRefreshInterceptor';
import { attachAuthHeader } from '@/shared/api/interceptors/attachAuthHeader';
import { ENV } from '@/shared/env/env';

const refreshAuthClient = createHttpClient({ baseURL: ENV.API_BASE_URL });
const refreshAccessToken = createRefreshAccessToken(refreshAuthClient);

export const apiClient = createHttpClient({ baseURL: ENV.API_BASE_URL });

export const javaApiClient = createHttpClient({ baseURL: ENV.JAVA_API_BASE_URL });

apiClient.interceptors.request.use(attachAuthHeader);
javaApiClient.interceptors.request.use(attachAuthHeader);
applyAuthRefreshInterceptor(apiClient, refreshAccessToken);
applyAuthRefreshInterceptor(javaApiClient, refreshAccessToken);


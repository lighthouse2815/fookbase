const toTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const IS_DEV = Boolean(import.meta.env.DEV);

const readRequiredEnv = (value: unknown, key: string, fallbackInDev?: string): string => {
  const trimmed = toTrimmedString(value);

  if (trimmed) {
    return trimmed;
  }

  if (IS_DEV && fallbackInDev) {
    return fallbackInDev;
  }

  throw new Error(`[ENV] Missing required environment variable: ${key}`);
};

export const ENV = {
  API_BASE_URL: readRequiredEnv(
    import.meta.env.VITE_API_BASE_URL,
    'VITE_API_BASE_URL',
    'https://localhost:7000',
  ),
  JAVA_API_BASE_URL: readRequiredEnv(
    import.meta.env.VITE_JAVA_API_BASE_URL,
    'VITE_JAVA_API_BASE_URL',
    'http://localhost:8080',
  ),
  GOOGLE_WEB_CLIENT_ID: toTrimmedString(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID),
  IS_DEV,
} as const;

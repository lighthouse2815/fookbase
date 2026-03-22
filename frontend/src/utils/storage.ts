export const STORAGE_KEYS = {
  token: 'interacthub_token',
  theme: 'interacthub_theme',
  language: 'interacthub_language',
  rememberMe: 'interacthub_remember_me',
} as const;

export const storage = {
  getToken: (): string | null => localStorage.getItem(STORAGE_KEYS.token),
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.token, token);
  },
  clearToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.token);
  },
};


export const STORAGE_KEYS = {
  token: 'interacthub_token',
  user: 'interacthub_user',
  theme: 'interacthub_theme',
  language: 'interacthub_language',
  rememberMe: 'interacthub_remember_me',
  profileCompleted: 'interacthub_profile_completed',
} as const;

export const storage = {
  getToken: (): string | null => localStorage.getItem(STORAGE_KEYS.token),
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.token, token);
  },
  clearToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.token);
  },
  getUser: <T = unknown>(): T | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser: (user: unknown): void => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  },
  clearUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.user);
  },
  getProfileCompleted: (): boolean | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.profileCompleted);
    if (raw === null) {
      return null;
    }

    return raw === 'true';
  },
  setProfileCompleted: (completed: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.profileCompleted, String(completed));
  },
  clearProfileCompleted: (): void => {
    localStorage.removeItem(STORAGE_KEYS.profileCompleted);
  },
};


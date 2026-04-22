export const STORAGE_KEYS = {
  token: 'interacthub_token',
  user: 'interacthub_user',
  theme: 'interacthub_theme',
  language: 'interacthub_language',
  rememberMe: 'interacthub_remember_me',
  profileCompleted: 'interacthub_profile_completed',
  completeProfileMode: 'interacthub_complete_profile_mode',
  completeProfilePrefill: 'interacthub_complete_profile_prefill',
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
  getCompleteProfileMode: (): string | null => localStorage.getItem(STORAGE_KEYS.completeProfileMode),
  setCompleteProfileMode: (mode: string): void => {
    localStorage.setItem(STORAGE_KEYS.completeProfileMode, mode);
  },
  clearCompleteProfileMode: (): void => {
    localStorage.removeItem(STORAGE_KEYS.completeProfileMode);
  },
  getCompleteProfilePrefill: <T = unknown>(): T | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.completeProfilePrefill);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setCompleteProfilePrefill: (prefill: unknown): void => {
    localStorage.setItem(STORAGE_KEYS.completeProfilePrefill, JSON.stringify(prefill));
  },
  clearCompleteProfilePrefill: (): void => {
    localStorage.removeItem(STORAGE_KEYS.completeProfilePrefill);
  },
};


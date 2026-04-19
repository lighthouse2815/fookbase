const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_RESPONSE_TIMEOUT_MS = 45000;

type PromptReason = 'credential_returned' | string;

interface GoogleCredentialResponse {
  credential?: string;
}

interface PromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => PromptReason;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (listener?: (notification: PromptMomentNotification) => void) => void;
  disableAutoSelect: () => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface GoogleWindow {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleWindow;
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = async (): Promise<void> => {
  if (window.google?.accounts?.id) {
    return;
  }

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script.')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script.'));
      document.head.appendChild(script);
    });
  }

  await googleIdentityScriptPromise;
};

export const getGoogleWebClientId = (): string => {
  const value = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  return typeof value === 'string' ? value.trim() : '';
};

export const requestGoogleIdToken = async (clientId: string): Promise<string> => {
  if (!clientId.trim()) {
    throw new Error('Google login is not configured.');
  }

  await loadGoogleIdentityScript();

  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error('Google login is unavailable.');
  }

  return new Promise<string>((resolve, reject) => {
    let completed = false;
    const timeoutId = window.setTimeout(() => {
      if (completed) {
        return;
      }
      completed = true;
      reject(new Error('Google login timed out. Please try again.'));
    }, GOOGLE_RESPONSE_TIMEOUT_MS);

    const resolveOnce = (token: string) => {
      if (completed) {
        return;
      }
      completed = true;
      window.clearTimeout(timeoutId);
      resolve(token);
    };

    const rejectOnce = (message: string) => {
      if (completed) {
        return;
      }
      completed = true;
      window.clearTimeout(timeoutId);
      reject(new Error(message));
    };

    googleId.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: false,
      callback: (response: GoogleCredentialResponse) => {
        const token = response.credential?.trim();
        if (!token) {
          rejectOnce('Google login failed. Please try again.');
          return;
        }

        resolveOnce(token);
      },
    });

    googleId.disableAutoSelect();
    googleId.prompt((notification: PromptMomentNotification) => {
      if (completed) {
        return;
      }

      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        rejectOnce('Google login is unavailable right now.');
        return;
      }

      if (notification.isDismissedMoment?.() && notification.getDismissedReason?.() !== 'credential_returned') {
        rejectOnce('Google login was cancelled.');
      }
    });
  });
};

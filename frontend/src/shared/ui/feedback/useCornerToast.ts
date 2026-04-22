import { useCallback, useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
}

const DEFAULT_DURATION_MS = 2400;

export const useCornerToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', durationMs = DEFAULT_DURATION_MS) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({ message, type });

      timeoutRef.current = window.setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, durationMs);
    },
    [],
  );

  useEffect(() => clearToast, [clearToast]);

  return {
    toast,
    showToast,
    clearToast,
  };
};

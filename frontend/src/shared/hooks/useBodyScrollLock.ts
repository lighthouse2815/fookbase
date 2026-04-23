import { useEffect } from 'react';

let bodyScrollLockCount = 0;
let previousOverflow = '';
let previousPaddingRight = '';

const lockBodyScroll = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const body = document.body;

  if (bodyScrollLockCount === 0) {
    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  bodyScrollLockCount += 1;
};

const unlockBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

  if (bodyScrollLockCount === 0) {
    const body = document.body;
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
  }
};

export const useBodyScrollLock = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [enabled]);
};

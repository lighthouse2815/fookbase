import { useEffect, useState } from 'react';

const AUTH_MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export const useAuthMobileViewport = () => {
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(AUTH_MOBILE_MEDIA_QUERY).matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(AUTH_MOBILE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isMobileViewport;
};


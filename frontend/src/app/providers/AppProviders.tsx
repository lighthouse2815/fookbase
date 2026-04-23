import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { AuthSuccessTransitionProvider } from '@/features/auth/contexts/AuthSuccessTransitionContext';
import { StoryProvider } from '@/features/story/contexts/StoryContext';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import type { AppProvidersProps } from '@/app/providers/types';

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoryProvider>
          <BrowserRouter>
            <AuthSuccessTransitionProvider>{children}</AuthSuccessTransitionProvider>
          </BrowserRouter>
        </StoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

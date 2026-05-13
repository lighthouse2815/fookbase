import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { AppErrorBoundary } from './app/ErrorBoundary';
import '@/shared/i18n';
import { AppProviders } from '@/app/providers/AppProviders';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </AppProviders>
  </StrictMode>,
);

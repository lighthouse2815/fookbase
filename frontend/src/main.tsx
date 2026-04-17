import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { StoryProvider } from './contexts/StoryContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StoryProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StoryProvider>
      </AuthProvider> 
    </ThemeProvider>
  </StrictMode>,
);


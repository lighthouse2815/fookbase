import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/contexts/AuthContext';

export const ProtectedRoute = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isInitializing, requiresProfileCompletion } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (!requiresProfileCompletion && location.pathname === '/complete-profile') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};



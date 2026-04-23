import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/contexts/AuthContext';

export const AdminRoute = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location, message: t('auth.adminLoginRequired') }}
        replace
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

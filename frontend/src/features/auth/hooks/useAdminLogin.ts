import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useAuthSuccessTransition } from '@/features/auth/contexts/AuthSuccessTransitionContext';
import { getApiErrorMessage } from '@/shared/api/error';

import type { AdminLoginFormValues, AdminLoginLocationState } from '@/features/auth/types/hooks';
import { resolveAdminLoginDestination } from '@/features/auth/utils/form.util';

export const useAdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAuthenticated, isAdmin } = useAuth();
  const { playSuccessTransition, isTransitioning } = useAuthSuccessTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [isCompletingAdminLogin, setIsCompletingAdminLogin] = useState(false);

  const locationState = (location.state as AdminLoginLocationState | null) ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    mode: 'onTouched',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    try {
      setApiError(undefined);
      setIsCompletingAdminLogin(true);
      await loginAdmin(data);

      const destination = resolveAdminLoginDestination(locationState);
      playSuccessTransition({
        tone: 'admin',
        onNavigate: () => {
          navigate(destination, { replace: true });
          setIsCompletingAdminLogin(false);
        },
      });
    } catch (error) {
      setIsCompletingAdminLogin(false);
      setApiError(getApiErrorMessage(error, t('auth.adminLoginError')));
    }
  };

  return {
    t,
    isAuthenticated,
    isAdmin,
    isTransitioning,
    isCompletingAdminLogin,
    showPassword,
    setShowPassword,
    apiError,
    locationState,
    register,
    handleSubmit,
    formErrors: errors,
    isSubmitting,
    onSubmit,
  };
};

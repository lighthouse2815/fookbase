import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useLocaleText } from '@/hooks/useLocaleText';
import { getApiErrorMessage } from '@/utils/apiError';

import type { AdminLoginFormValues, AdminLoginLocationState } from '@/pages/auth/interface';
import { resolveAdminLoginDestination } from '@/pages/auth/util';

export const useAdminLogin = () => {
  const { t } = useTranslation();
  const tx = useLocaleText();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAuthenticated, isAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

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
      await loginAdmin(data);

      const destination = resolveAdminLoginDestination(locationState);
      navigate(destination, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, tx('Đăng nhập admin thất bại.', 'Admin login failed.')));
    }
  };

  return {
    t,
    tx,
    isAuthenticated,
    isAdmin,
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

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AuthForm } from '../../components/auth/AuthForm';
import { InputField } from '../../components/auth/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

interface LoginFormValues {
  username: string;
  password: string;
  // rememberMe: boolean;
}

const identifierPattern = /^([a-zA-Z0-9._-]{3,}|[\w.-]+@[\w-]+\.[\w.-]{2,})$/;

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: 'onTouched',
    defaultValues: {
      username: '',
      password: '',
      // rememberMe: true,
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setApiError(undefined);
      await login(data);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(destination, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.loginError')));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title={t('auth.loginTitle')}
        subtitle={t('auth.loginSubtitle')}
        submitLabel={t('auth.loginButton')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        isSubmitting={isSubmitting}
        errorMessage={apiError}
        footer={
          <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">
            {t('auth.redirectToRegister')}
          </Link>
        }
      >
        <InputField
          label={t('auth.identifier')}
          placeholder={t('auth.identifier')}
          autoComplete="username"
          registration={register('username', {
            required: t('auth.required'),
            pattern: {
              value: identifierPattern,
              message: t('auth.identifierFormat'),
            },
          })}
          error={errors.username?.message}
        />

        <InputField
          label={t('auth.password')}
          placeholder={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          registration={register('password', {
            required: t('auth.required'),
          })}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('username')}
          />
          {t('auth.rememberMe')}
        </label>
      </AuthForm>
    </div>
  );
};


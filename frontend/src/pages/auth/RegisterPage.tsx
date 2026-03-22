import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthForm } from '../../components/auth/AuthForm';
import { InputField } from '../../components/auth/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { getPasswordStrength } from '../../utils/passwordStrength';

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setApiError(undefined);
      const hasToken = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });

      navigate(hasToken ? '/' : '/login', { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.registerError')));
    }
  };

  const strengthLabelMap = {
    weak: t('auth.passwordWeak'),
    medium: t('auth.passwordMedium'),
    strong: t('auth.passwordStrong'),
  } as const;

  const strengthColorMap = {
    weak: 'bg-rose-500',
    medium: 'bg-amber-500',
    strong: 'bg-emerald-500',
  } as const;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title={t('auth.registerTitle')}
        subtitle={t('auth.registerSubtitle')}
        submitLabel={t('auth.registerButton')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        isSubmitting={isSubmitting}
        errorMessage={apiError}
        footer={
          <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">
            {t('auth.redirectToLogin')}
          </Link>
        }
      >
        <InputField
          label={t('auth.username')}
          placeholder={t('auth.username')}
          autoComplete="username"
          registration={register('username', {
            required: t('auth.required'),
            minLength: {
              value: 3,
              message: t('auth.usernameMin'),
            },
          })}
          error={errors.username?.message}
        />

        <InputField
          label={t('auth.email')}
          placeholder={t('auth.email')}
          type="email"
          autoComplete="email"
          registration={register('email', {
            required: t('auth.required'),
            pattern: {
              value: emailPattern,
              message: t('auth.invalidEmail'),
            },
          })}
          error={errors.email?.message}
        />

        <div className="space-y-3">
          <InputField
            label={t('auth.password')}
            placeholder={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            registration={register('password', {
              required: t('auth.required'),
              minLength: {
                value: 8,
                message: t('auth.passwordMin'),
              },
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

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t('auth.passwordStrength')}</span>
              <span>{strengthLabelMap[strength.label]}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all ${strengthColorMap[strength.label]}`}
                style={{ width: `${Math.max(20, (strength.score / 4) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <InputField
          label={t('auth.confirmPassword')}
          placeholder={t('auth.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          registration={register('confirmPassword', {
            required: t('auth.required'),
            validate: (value) => value === getValues('password') || t('auth.passwordMatch'),
          })}
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </AuthForm>
    </div>
  );
};


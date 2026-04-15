import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AuthForm } from '../../components/auth/AuthForm';
import { InputField } from '../../components/auth/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { useLocaleText } from '../../hooks/useLocaleText';
import { getApiErrorMessage } from '../../utils/apiError';

interface AdminLoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface AdminLoginLocationState {
  from?: { pathname?: string };
  message?: string;
}

export const AdminLoginPage = () => {
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

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: AdminLoginFormValues) => {
    try {
      setApiError(undefined);
      await loginAdmin(data);

      const requestedPath = locationState?.from?.pathname;
      const destination = requestedPath?.startsWith('/admin') ? requestedPath : '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, tx('Đăng nhập admin thất bại.', 'Admin login failed.')));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title={tx('Đăng nhập admin', 'Admin Sign In')}
        subtitle={tx('Trang này chỉ dành cho tài khoản quản trị.', 'This page is only for administrator accounts.')}
        submitLabel={tx('Đăng nhập admin', 'Sign in as admin')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        isSubmitting={isSubmitting}
        errorMessage={apiError}
        footer={
          <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <ShieldCheck size={16} />
            {tx('Không hỗ trợ đăng ký tại đây.', 'Registration is not available here.')}
          </span>
        }
      >
        {locationState?.message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">
            {locationState.message}
          </div>
        ) : null}

        <InputField
          label={tx('Tên đăng nhập', 'Username')}
          placeholder={tx('Nhập username admin', 'Enter admin username')}
          autoComplete="username"
          registration={register('username', {
            required: tx('Vui lòng nhập username.', 'Username is required.'),
          })}
          error={errors.username?.message}
        />

        <InputField
          label={tx('Mật khẩu', 'Password')}
          placeholder={tx('Nhập mật khẩu', 'Enter password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          registration={register('password', {
            required: tx('Vui lòng nhập mật khẩu.', 'Password is required.'),
          })}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? tx('Ẩn mật khẩu', 'Hide password') : tx('Hiện mật khẩu', 'Show password')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...register('rememberMe')}
          />
          {tx('Ghi nhớ đăng nhập', 'Remember me')}
        </label>
      </AuthForm>
    </div>
  );
};

import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AuthForm } from '../../components/auth/AuthForm';
import { InputField } from '../../components/auth/InputField';
import { useAuth } from '../../contexts/AuthContext';
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
      setApiError(getApiErrorMessage(error, 'Dang nhap admin that bai.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title="Admin Sign In"
        subtitle="Trang nay chi danh cho tai khoan quan tri."
        submitLabel="Dang nhap admin"
        loadingLabel="Dang xu ly..."
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        isSubmitting={isSubmitting}
        errorMessage={apiError}
        footer={
          <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <ShieldCheck size={16} />
            Khong ho tro dang ky tai day.
          </span>
        }
      >
        {locationState?.message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">
            {locationState.message}
          </div>
        ) : null}

        <InputField
          label="Username"
          placeholder="Nhap username admin"
          autoComplete="username"
          registration={register('username', {
            required: 'Vui long nhap username.',
          })}
          error={errors.username?.message}
        />

        <InputField
          label="Password"
          placeholder="Nhap mat khau"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          registration={register('password', {
            required: 'Vui long nhap mat khau.',
          })}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'An mat khau' : 'Hien mat khau'}
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
          Ghi nho dang nhap
        </label>
      </AuthForm>
    </div>
  );
};

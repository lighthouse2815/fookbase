import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AUTH_FIELD_ITEM_VARIANTS, AUTH_FIELD_STAGGER_VARIANTS } from '@/features/auth/animations/authMotion';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { AuthSwitcher } from '@/features/auth/components/AuthSwitcher';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useAdminLogin } from '@/features/auth/hooks/useAdminLogin';

export const AdminLoginPage = () => {
  const {
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
    formErrors,
    isSubmitting,
    onSubmit,
  } = useAdminLogin();

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      tone="admin"
      eyebrow="Admin Console"
      title={tx('Dang nhap quan tri', 'Administrator Sign In')}
      description={tx(
        'Khu vuc nay danh cho tai khoan quan tri va duoc giam sat bao mat.',
        'This area is restricted to administrator accounts and is actively monitored.',
      )}
      highlights={[
        tx('Tat ca thao tac duoc ghi log', 'All administrative actions are audited'),
        tx('Phien dang nhap duoc ma hoa', 'Sign-in sessions are strongly encrypted'),
        tx('Chi tai khoan co quyen moi duoc truy cap', 'Only privileged accounts can access this area'),
      ]}
    >
      <AuthCard
        tone="admin"
        title={tx('Dang nhap admin', 'Admin Sign In')}
        subtitle={tx(
          'Vui long su dung tai khoan quan tri da duoc cap phep.',
          'Please use an approved administrator account.',
        )}
        footer={<AuthSwitcher prompt={tx('Khong phai admin?', 'Not an admin?')} actionLabel="Go to user login" to="/login" />}
      >
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
          <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
            {locationState?.message ? (
              <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                <AuthMessage kind="warning">{locationState.message}</AuthMessage>
              </motion.div>
            ) : null}

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <AuthInput
                tone="admin"
                label={tx('Ten dang nhap', 'Username')}
                placeholder={tx('Nhap username admin', 'Enter admin username')}
                autoComplete="username"
                registration={register('username', {
                  required: tx('Vui long nhap username.', 'Username is required.'),
                })}
                error={formErrors.username?.message}
              />
            </motion.div>

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <PasswordField
                tone="admin"
                label={tx('Mat khau', 'Password')}
                placeholder={tx('Nhap mat khau', 'Enter password')}
                autoComplete="current-password"
                registration={register('password', {
                  required: tx('Vui long nhap mat khau.', 'Password is required.'),
                })}
                error={formErrors.password?.message}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword((value) => !value)}
                showLabel={tx('Hien mat khau', 'Show password')}
                hideLabel={tx('An mat khau', 'Hide password')}
              />
            </motion.div>

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200/85">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-rose-500 focus:ring-2 focus:ring-rose-400"
                  {...register('rememberMe')}
                />
                {tx('Ghi nho dang nhap', 'Remember me')}
              </label>
            </motion.div>

            {apiError ? (
              <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                <AuthMessage kind="error">{apiError}</AuthMessage>
              </motion.div>
            ) : null}

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <AuthSubmitButton
                tone="admin"
                label={tx('Dang nhap admin', 'Sign in as admin')}
                loadingLabel={t('common.loading')}
                isLoading={isSubmitting}
              />
            </motion.div>
          </motion.div>
        </form>

        <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300/65">
          <LockKeyhole size={14} />
          Elevated access zone
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

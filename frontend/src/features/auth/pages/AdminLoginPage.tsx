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
    isAuthenticated,
    isAdmin,
    isTransitioning,
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

  if (isAuthenticated && isAdmin && !isTransitioning) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isAuthenticated && !isAdmin && !isTransitioning) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      tone="admin"
      eyebrow={t('auth.adminEyebrow')}
      title={t('auth.adminTitle')}
      description={t('auth.adminDescription')}
      highlights={[
        t('auth.adminHighlightAudit'),
        t('auth.adminHighlightEncrypted'),
        t('auth.adminHighlightRestricted'),
      ]}
    >
      <AuthCard
        tone="admin"
        title={t('auth.adminCardTitle')}
        subtitle={t('auth.adminCardSubtitle')}
        footer={
          <AuthSwitcher
            prompt={t('auth.adminNonAdminPrompt')}
            actionLabel={t('auth.adminGoUserLogin')}
            to="/login"
          />
        }
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
                label={t('auth.username')}
                placeholder={t('auth.adminUsernamePlaceholder')}
                autoComplete="username"
                registration={register('username', {
                  required: t('auth.adminUsernameRequired'),
                })}
                error={formErrors.username?.message}
              />
            </motion.div>

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <PasswordField
                tone="admin"
                label={t('auth.password')}
                placeholder={t('auth.adminPasswordPlaceholder')}
                autoComplete="current-password"
                registration={register('password', {
                  required: t('auth.adminPasswordRequired'),
                })}
                error={formErrors.password?.message}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword((value) => !value)}
                showLabel={t('auth.showPassword')}
                hideLabel={t('auth.hidePassword')}
              />
            </motion.div>

            <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200/85">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-rose-500 focus:ring-2 focus:ring-rose-400"
                  {...register('rememberMe')}
                />
                {t('auth.rememberMe')}
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
                label={t('auth.adminSignInButton')}
                loadingLabel={t('common.loading')}
                isLoading={isSubmitting}
              />
            </motion.div>
          </motion.div>
        </form>

        <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300/65">
          <LockKeyhole size={14} />
          {t('auth.adminElevatedAccess')}
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

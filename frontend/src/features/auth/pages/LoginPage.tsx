import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Chrome, Sparkles } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

import { AUTH_FIELD_ITEM_VARIANTS, AUTH_FIELD_STAGGER_VARIANTS } from '@/features/auth/animations/authMotion';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { AuthSwitcher } from '@/features/auth/components/AuthSwitcher';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useLogin } from '@/features/auth/hooks/useLogin';

export const LoginPage = () => {
  const {
    t,
    isAuthenticated,
    step,
    locationState,
    apiError,
    infoMessage,
    loginForm,
    otpForm,
    showPassword,
    setShowPassword,
    isGoogleSubmitting,
    inactiveEmail,
    bannedMessage,
    identifierPattern,
    otpPattern,
    onSubmitLogin,
    onSubmitOtp,
    handleResendOtp,
    goBackToLoginFromOtp,
    goBackToLoginFromBanned,
    onSubmitGoogle,
  } = useLogin();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (step === 'banned') {
    return (
      <AuthLayout
        tone="admin"
        eyebrow="Restricted Account"
        title="Your access has been disabled"
        description="This account is locked. Contact support if you think this is a mistake."
        highlights={[
          'Security actions are logged',
          'Only verified appeals are reviewed',
          'Sensitive operations remain blocked',
        ]}
      >
        <AuthCard
          tone="admin"
          title="Account suspended"
          subtitle={bannedMessage || 'Your account is currently unavailable for sign in.'}
          footer={
            <AuthSwitcher
              prompt=""
              actionLabel="Back to login"
              onClick={goBackToLoginFromBanned}
            />
          }
        >
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/60">
            <video
              src="/bann_user.mp4"
              className="h-auto max-h-[44vh] w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  const isOtpStep = step === 'otp';

  return (
    <AuthLayout
      tone={isOtpStep ? 'recovery' : 'user'}
      eyebrow={isOtpStep ? 'Email Verification' : 'Welcome Back'}
      title={isOtpStep ? t('auth.verifyEmailTitle') : t('auth.loginTitle')}
      description={isOtpStep ? t('auth.verifyEmailSubtitle') : t('auth.loginSubtitle')}
      highlights={
        isOtpStep
          ? ['OTP expires quickly for security', 'Email verification protects your profile', 'Resend code if needed']
          : ['Fast and secure sign in', 'Modern privacy-first session handling', 'Built for mobile and desktop']
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOtpStep ? (
          <motion.div key="login-otp-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="recovery"
              title={t('auth.verifyEmailTitle')}
              subtitle={t('auth.verifyEmailSubtitle')}
              footer={
                <AuthSwitcher
                  prompt=""
                  actionLabel="Back to login"
                  onClick={goBackToLoginFromOtp}
                />
              }
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void otpForm.handleSubmit(onSubmitOtp)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/35">
                      <img
                        src="/pic_verify_email.jpg"
                        alt={t('auth.verifyEmailTitle')}
                        className="h-auto w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </motion.div>

                  {infoMessage ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="success">{infoMessage}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthMessage kind="info">
                      {t('auth.verifyingFor')}: <span className="font-semibold">{inactiveEmail}</span>
                    </AuthMessage>
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthInput
                      tone="recovery"
                      label={t('auth.otpCode')}
                      placeholder={t('auth.otpCode')}
                      autoComplete="one-time-code"
                      registration={otpForm.register('otp', {
                        required: t('auth.required'),
                        pattern: {
                          value: otpPattern,
                          message: t('auth.invalidOtp'),
                        },
                      })}
                      error={otpForm.formState.errors.otp?.message}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      className="w-full rounded-2xl border border-cyan-200/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/55 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => void handleResendOtp()}
                      disabled={otpForm.formState.isSubmitting}
                    >
                      {t('auth.resendOtpButton')}
                    </motion.button>
                  </motion.div>

                  {apiError ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="error">{apiError}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthSubmitButton
                      tone="recovery"
                      label={t('auth.verifyOtpButton')}
                      loadingLabel={t('common.loading')}
                      isLoading={otpForm.formState.isSubmitting}
                    />
                  </motion.div>
                </motion.div>
              </form>
            </AuthCard>
          </motion.div>
        ) : (
          <motion.div key="login-main-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="user"
              title={t('auth.loginTitle')}
              subtitle={t('auth.loginSubtitle')}
              footer={(
                <AuthSwitcher
                  prompt="New here?"
                  actionLabel="Create account"
                  to="/register"
                />
              )}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void loginForm.handleSubmit(onSubmitLogin)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  {locationState?.message ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="success">{locationState.message}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthInput
                      tone="user"
                      label={t('auth.identifier')}
                      placeholder={t('auth.identifier')}
                      autoComplete="username"
                      registration={loginForm.register('username', {
                        required: t('auth.required'),
                        pattern: {
                          value: identifierPattern,
                          message: t('auth.identifierFormat'),
                        },
                      })}
                      error={loginForm.formState.errors.username?.message}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <PasswordField
                      tone="user"
                      label={t('auth.password')}
                      placeholder={t('auth.password')}
                      autoComplete="current-password"
                      registration={loginForm.register('password', {
                        required: t('auth.required'),
                      })}
                      error={loginForm.formState.errors.password?.message}
                      showPassword={showPassword}
                      onToggleVisibility={() => setShowPassword((value) => !value)}
                      showLabel={t('auth.showPassword')}
                      hideLabel={t('auth.hidePassword')}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => void onSubmitGoogle()}
                      disabled={isGoogleSubmitting || loginForm.formState.isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Chrome size={16} />
                      {isGoogleSubmitting ? t('common.loading') : t('auth.googleButton')}
                    </motion.button>
                  </motion.div>

                  <motion.div
                    variants={AUTH_FIELD_ITEM_VARIANTS}
                    className="flex flex-col items-start gap-3 text-sm text-slate-200/85 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/30 bg-white/10 text-brand-500 focus:ring-2 focus:ring-brand-400"
                        {...loginForm.register('rememberMe')}
                      />
                      {t('auth.rememberMe')}
                    </label>
                    <Link className="font-medium text-brand-200 transition hover:text-brand-100" to="/forgot-password">
                      {t('auth.forgotPassword')}
                    </Link>
                  </motion.div>

                  {apiError ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="error">{apiError}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthSubmitButton
                      tone="user"
                      label={t('auth.loginButton')}
                      loadingLabel={t('common.loading')}
                      isLoading={loginForm.formState.isSubmitting}
                    />
                  </motion.div>
                </motion.div>
              </form>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300/65">
                <Sparkles size={14} />
                Secure session handoff
              </div>
            </AuthCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOtpStep ? (
        <div className="mt-4 flex justify-center">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-200/85 transition hover:text-white"
            to="/admin/login"
          >
            <ArrowLeft size={15} />
            Switch to admin sign in
          </Link>
        </div>
      ) : null}
    </AuthLayout>
  );
};

import { motion } from 'framer-motion';
import { Chrome, Sparkles } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { AUTH_FIELD_ITEM_VARIANTS, AUTH_FIELD_STAGGER_VARIANTS } from '@/features/auth/animations/authMotion';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthFormTransition } from '@/features/auth/components/AuthFormTransition';
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
    isTransitioning,
    isCompletingLogin,
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

  if (isAuthenticated && !isTransitioning && !isCompletingLogin) {
    return <Navigate to="/" replace />;
  }

  if (step === 'banned') {
    return (
      <AuthLayout
        tone="admin"
        eyebrow={t('auth.bannedEyebrow')}
        title={t('auth.bannedTitle')}
        description={t('auth.bannedDescription')}
        highlights={[
          t('auth.bannedHighlightAudit'),
          t('auth.bannedHighlightAppeal'),
          t('auth.bannedHighlightSensitive'),
        ]}
      >
        <AuthCard
          tone="admin"
          title={t('auth.bannedCardTitle')}
          subtitle={bannedMessage || t('auth.bannedCardSubtitleFallback')}
          headerKey="login-banned-header"
          layoutId="auth-banned-card"
          footer={
            <AuthSwitcher
              prompt=""
              actionLabel={t('auth.backToLoginShort')}
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
  const tone = isOtpStep ? 'recovery' : 'user';

  return (
    <AuthLayout
      tone={tone}
      eyebrow={isOtpStep ? t('auth.loginEyebrowVerifyEmail') : t('auth.loginEyebrowWelcome')}
      title={isOtpStep ? t('auth.verifyEmailTitle') : t('auth.loginTitle')}
      description={isOtpStep ? t('auth.verifyEmailSubtitle') : t('auth.loginSubtitle')}
      highlights={
        isOtpStep
          ? [t('auth.otpHighlightExpiry'), t('auth.otpHighlightProtect'), t('auth.otpHighlightResend')]
          : [t('auth.loginHighlightFast'), t('auth.loginHighlightPrivacy'), t('auth.loginHighlightBuilt')]
      }
    >
      <AuthCard
        tone={tone}
        title={isOtpStep ? t('auth.verifyEmailTitle') : t('auth.loginTitle')}
        subtitle={isOtpStep ? t('auth.verifyEmailSubtitle') : t('auth.loginSubtitle')}
        headerKey={`login-header-${step}`}
        layoutId="auth-primary-card"
        footer={
          isOtpStep ? (
            <AuthSwitcher
              prompt=""
              actionLabel={t('auth.backToLoginShort')}
              onClick={goBackToLoginFromOtp}
            />
          ) : (
            <AuthSwitcher
              prompt={t('auth.newHerePrompt')}
              actionLabel={t('auth.createAccountAction')}
              to="/register"
            />
          )
        }
      >
        <AuthFormTransition transitionKey={`login-content-${step}`}>
          {isOtpStep ? (
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
          ) : (
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
                    whileHover={{ y: -1 }}
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
          )}
        </AuthFormTransition>

        {!isOtpStep ? (
          <motion.div
            initial={{ opacity: 0.72, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300/65"
          >
            <Sparkles size={14} />
            {t('auth.secureSessionHandoff')}
          </motion.div>
        ) : null}
      </AuthCard>
    </AuthLayout>
  );
};

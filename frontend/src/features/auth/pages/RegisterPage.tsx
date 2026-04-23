import { AnimatePresence, motion } from 'framer-motion';
import { Chrome, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AUTH_FIELD_ITEM_VARIANTS, AUTH_FIELD_STAGGER_VARIANTS } from '@/features/auth/animations/authMotion';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { AuthSwitcher } from '@/features/auth/components/AuthSwitcher';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useRegister } from '@/features/auth/hooks/useRegister';

export const RegisterPage = () => {
  const {
    t,
    isAuthenticated,
    step,
    registeredEmail,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isGoogleSubmitting,
    apiError,
    infoMessage,
    registerForm,
    otpForm,
    strength,
    strengthLabelMap,
    strengthColorMap,
    emailPattern,
    phonePattern,
    otpPattern,
    onSubmitRegister,
    onSubmitOtp,
    handleResendOtp,
    backToRegister,
    onSubmitGoogle,
  } = useRegister();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isOtpStep = step === 'otp';

  return (
    <AuthLayout
      tone="register"
      eyebrow={isOtpStep ? t('auth.registerEyebrowVerify') : t('auth.registerEyebrowCreate')}
      title={isOtpStep ? t('auth.verifyEmailTitle') : t('auth.registerTitle')}
      description={isOtpStep ? t('auth.verifyEmailSubtitle') : t('auth.registerSubtitle')}
      highlights={
        isOtpStep
          ? [
              t('auth.registerHighlightActivation'),
              t('auth.registerHighlightCodeWindow'),
              t('auth.registerHighlightResend'),
            ]
          : [
              t('auth.registerHighlightOnboarding'),
              t('auth.registerHighlightSecurity'),
              t('auth.registerHighlightPremium'),
            ]
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOtpStep ? (
          <motion.div key="register-otp-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="recovery"
              title={t('auth.verifyEmailTitle')}
              subtitle={t('auth.verifyEmailSubtitle')}
              footer={(
                <AuthSwitcher
                  prompt=""
                  actionLabel={t('auth.backToRegister')}
                  onClick={backToRegister}
                />
              )}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void otpForm.handleSubmit(onSubmitOtp)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  {infoMessage ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="success">{infoMessage}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthMessage kind="info">
                      {t('auth.verifyingFor')}: <span className="font-semibold">{registeredEmail}</span>
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
          <motion.div key="register-main-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="register"
              title={t('auth.registerTitle')}
              subtitle={t('auth.registerSubtitle')}
              footer={
                <AuthSwitcher
                  prompt={t('auth.alreadyHaveAccountPrompt')}
                  actionLabel={t('auth.signInAction')}
                  to="/login"
                />
              }
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void registerForm.handleSubmit(onSubmitRegister)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS} className="grid gap-4 sm:grid-cols-2">
                    <AuthInput
                      tone="register"
                      label={t('auth.lastName')}
                      placeholder={t('auth.lastName')}
                      autoComplete="family-name"
                      registration={registerForm.register('lastName', {
                        required: t('auth.required'),
                      })}
                      error={registerForm.formState.errors.lastName?.message}
                    />
                    <AuthInput
                      tone="register"
                      label={t('auth.firstName')}
                      placeholder={t('auth.firstName')}
                      autoComplete="given-name"
                      registration={registerForm.register('firstName', {
                        required: t('auth.required'),
                      })}
                      error={registerForm.formState.errors.firstName?.message}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthInput
                      tone="register"
                      label={t('auth.phone')}
                      placeholder={t('auth.phone')}
                      type="tel"
                      autoComplete="tel"
                      registration={registerForm.register('phone', {
                        required: t('auth.required'),
                        pattern: {
                          value: phonePattern,
                          message: t('auth.invalidPhone'),
                        },
                      })}
                      error={registerForm.formState.errors.phone?.message}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthInput
                      tone="register"
                      label={t('auth.email')}
                      placeholder={t('auth.email')}
                      type="email"
                      autoComplete="email"
                      registration={registerForm.register('email', {
                        required: t('auth.required'),
                        pattern: {
                          value: emailPattern,
                          message: t('auth.invalidEmail'),
                        },
                      })}
                      error={registerForm.formState.errors.email?.message}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <PasswordField
                      tone="register"
                      label={t('auth.password')}
                      placeholder={t('auth.password')}
                      autoComplete="new-password"
                      registration={registerForm.register('password', {
                        required: t('auth.required'),
                        minLength: {
                          value: 8,
                          message: t('auth.passwordMin'),
                        },
                      })}
                      error={registerForm.formState.errors.password?.message}
                      showPassword={showPassword}
                      onToggleVisibility={() => setShowPassword((value) => !value)}
                      showLabel={t('auth.showPassword')}
                      hideLabel={t('auth.hidePassword')}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-200/80">
                      <span>{t('auth.passwordStrength')}</span>
                      <span className="font-semibold">{strengthLabelMap[strength.label]}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        className={`h-full ${strengthColorMap[strength.label]}`}
                        animate={{ width: `${Math.max(16, (strength.score / 4) * 100)}%` }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <PasswordField
                      tone="register"
                      label={t('auth.confirmPassword')}
                      placeholder={t('auth.confirmPassword')}
                      autoComplete="new-password"
                      registration={registerForm.register('confirmPassword', {
                        required: t('auth.required'),
                        validate: (value) => value === registerForm.getValues('password') || t('auth.passwordMatch'),
                      })}
                      error={registerForm.formState.errors.confirmPassword?.message}
                      showPassword={showConfirmPassword}
                      onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                      showLabel={t('auth.showPassword')}
                      hideLabel={t('auth.hidePassword')}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => void onSubmitGoogle()}
                      disabled={isGoogleSubmitting || registerForm.formState.isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Chrome size={16} />
                      {isGoogleSubmitting ? t('common.loading') : t('auth.googleRegisterButton')}
                    </motion.button>
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS} className="space-y-1.5">
                    <label className="inline-flex items-start gap-3 text-sm text-slate-200/85">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-brand-500 focus:ring-2 focus:ring-brand-400"
                        {...registerForm.register('acceptTerms', {
                          validate: (value) => value || t('auth.acceptTermsRequired'),
                        })}
                      />
                      <span>
                        {t('auth.termsPrefix')}{' '}
                        <a className="font-semibold text-brand-200 transition hover:text-brand-100" href="#" onClick={(event) => event.preventDefault()}>
                          {t('auth.termsTitle')}
                        </a>
                      </span>
                    </label>
                    {registerForm.formState.errors.acceptTerms?.message ? (
                      <p className="text-xs text-rose-200">{registerForm.formState.errors.acceptTerms.message}</p>
                    ) : null}
                  </motion.div>

                  {apiError ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="error">{apiError}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthSubmitButton
                      tone="register"
                      label={t('auth.registerButton')}
                      loadingLabel={t('common.loading')}
                      isLoading={registerForm.formState.isSubmitting}
                    />
                  </motion.div>
                </motion.div>
              </form>

              <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-300/65">
                <ShieldCheck size={14} />
                {t('auth.trustAndSafetyReady')}
              </div>
            </AuthCard>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

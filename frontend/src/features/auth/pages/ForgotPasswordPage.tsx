import { AnimatePresence, motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

import { AUTH_FIELD_ITEM_VARIANTS, AUTH_FIELD_STAGGER_VARIANTS } from '@/features/auth/animations/authMotion';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { AuthSwitcher } from '@/features/auth/components/AuthSwitcher';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';

export const ForgotPasswordPage = () => {
  const {
    t,
    isAuthenticated,
    step,
    email,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    apiError,
    infoMessage,
    emailForm,
    otpForm,
    resetPasswordForm,
    emailPattern,
    otpPattern,
    onSubmitEmail,
    onSubmitOtp,
    onSubmitResetPassword,
    handleResendOtp,
    backToEmailStep,
    backToOtpFromReset,
  } = useForgotPassword();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const toneByStep = step === 'reset' ? 'register' : 'recovery';
  const titleByStep =
    step === 'email'
      ? t('auth.forgotPasswordTitle')
      : step === 'otp'
        ? t('auth.verifyResetOtpTitle')
        : t('auth.resetPasswordTitle');
  const subtitleByStep =
    step === 'email'
      ? t('auth.forgotPasswordSubtitle')
      : step === 'otp'
        ? t('auth.verifyResetOtpSubtitle')
        : t('auth.resetPasswordSubtitle');

  return (
    <AuthLayout
      tone="recovery"
      eyebrow="Recovery Flow"
      title={titleByStep}
      description={subtitleByStep}
      highlights={[
        'One clean recovery flow across devices',
        'Secure OTP verification before password reset',
        'Session remains protected until reset is complete',
      ]}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'email' ? (
          <motion.div key="forgot-email-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="recovery"
              title={t('auth.forgotPasswordTitle')}
              subtitle={t('auth.forgotPasswordSubtitle')}
              footer={<AuthSwitcher prompt="Remembered it?" actionLabel="Back to login" to="/login" />}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void emailForm.handleSubmit(onSubmitEmail)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthInput
                      tone="recovery"
                      label={t('auth.email')}
                      placeholder={t('auth.email')}
                      type="email"
                      autoComplete="email"
                      registration={emailForm.register('email', {
                        required: t('auth.required'),
                        pattern: {
                          value: emailPattern,
                          message: t('auth.invalidEmail'),
                        },
                      })}
                      error={emailForm.formState.errors.email?.message}
                    />
                  </motion.div>

                  {apiError ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="error">{apiError}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthSubmitButton
                      tone="recovery"
                      label={t('auth.sendOtpButton')}
                      loadingLabel={t('common.loading')}
                      isLoading={emailForm.formState.isSubmitting}
                    />
                  </motion.div>
                </motion.div>
              </form>
            </AuthCard>
          </motion.div>
        ) : null}

        {step === 'otp' ? (
          <motion.div key="forgot-otp-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone="recovery"
              title={t('auth.verifyResetOtpTitle')}
              subtitle={t('auth.verifyResetOtpSubtitle')}
              footer={<AuthSwitcher prompt="" actionLabel={t('auth.backToEmailStep')} onClick={backToEmailStep} />}
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
                      {t('auth.verifyingFor')}: <span className="font-semibold">{email}</span>
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
        ) : null}

        {step === 'reset' ? (
          <motion.div key="forgot-reset-step" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <AuthCard
              tone={toneByStep}
              title={t('auth.resetPasswordTitle')}
              subtitle={t('auth.resetPasswordSubtitle')}
              footer={<AuthSwitcher prompt="" actionLabel={t('auth.backToOtpStep')} onClick={backToOtpFromReset} />}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => void resetPasswordForm.handleSubmit(onSubmitResetPassword)(event)}
                noValidate
              >
                <motion.div variants={AUTH_FIELD_STAGGER_VARIANTS} initial="hidden" animate="visible" className="space-y-4">
                  {infoMessage ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="success">{infoMessage}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <PasswordField
                      tone="register"
                      label={t('auth.newPassword')}
                      placeholder={t('auth.newPassword')}
                      autoComplete="new-password"
                      registration={resetPasswordForm.register('newPassword', {
                        required: t('auth.required'),
                        minLength: {
                          value: 8,
                          message: t('auth.passwordMin'),
                        },
                      })}
                      error={resetPasswordForm.formState.errors.newPassword?.message}
                      showPassword={showPassword}
                      onToggleVisibility={() => setShowPassword((value) => !value)}
                      showLabel={t('auth.showPassword')}
                      hideLabel={t('auth.hidePassword')}
                    />
                  </motion.div>

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <PasswordField
                      tone="register"
                      label={t('auth.confirmNewPassword')}
                      placeholder={t('auth.confirmNewPassword')}
                      autoComplete="new-password"
                      registration={resetPasswordForm.register('confirmNewPassword', {
                        required: t('auth.required'),
                        validate: (value) =>
                          value === resetPasswordForm.getValues('newPassword') || t('auth.passwordMatch'),
                      })}
                      error={resetPasswordForm.formState.errors.confirmNewPassword?.message}
                      showPassword={showConfirmPassword}
                      onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
                      showLabel={t('auth.showPassword')}
                      hideLabel={t('auth.hidePassword')}
                    />
                  </motion.div>

                  {apiError ? (
                    <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                      <AuthMessage kind="error">{apiError}</AuthMessage>
                    </motion.div>
                  ) : null}

                  <motion.div variants={AUTH_FIELD_ITEM_VARIANTS}>
                    <AuthSubmitButton
                      tone="register"
                      label={t('auth.resetPasswordButton')}
                      loadingLabel={t('common.loading')}
                      isLoading={resetPasswordForm.formState.isSubmitting}
                    />
                  </motion.div>
                </motion.div>
              </form>
            </AuthCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AuthLayout>
  );
};

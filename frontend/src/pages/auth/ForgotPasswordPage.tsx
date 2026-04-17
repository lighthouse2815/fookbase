import { Eye, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { AuthForm } from '@/components/auth/AuthForm';
import { InputField } from '@/components/auth/InputField';
import { useForgotPassword } from '@/pages/auth/hooks/useForgotPassword';

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

  if (step === 'email') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
        <AuthForm
          title={t('auth.forgotPasswordTitle')}
          subtitle={t('auth.forgotPasswordSubtitle')}
          submitLabel={t('auth.sendOtpButton')}
          loadingLabel={t('common.loading')}
          onSubmit={(event) => void emailForm.handleSubmit(onSubmitEmail)(event)}
          isSubmitting={emailForm.formState.isSubmitting}
          errorMessage={apiError}
          footer={
            <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">
              {t('auth.redirectToLogin')}
            </Link>
          }
        >
          <InputField
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
        </AuthForm>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
        <AuthForm
          title={t('auth.verifyResetOtpTitle')}
          subtitle={t('auth.verifyResetOtpSubtitle')}
          submitLabel={t('auth.verifyOtpButton')}
          loadingLabel={t('common.loading')}
          onSubmit={(event) => void otpForm.handleSubmit(onSubmitOtp)(event)}
          isSubmitting={otpForm.formState.isSubmitting}
          errorMessage={apiError}
          footer={
            <button
              type="button"
              className="font-semibold text-brand-600 hover:text-brand-700"
              onClick={backToEmailStep}
            >
              {t('auth.backToEmailStep')}
            </button>
          }
        >
          {infoMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {infoMessage}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {t('auth.verifyingFor')}: <span className="font-semibold">{email}</span>
          </div>

          <InputField
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

          <button
            type="button"
            className="w-full rounded-xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
            onClick={() => void handleResendOtp()}
            disabled={otpForm.formState.isSubmitting}
          >
            {t('auth.resendOtpButton')}
          </button>
        </AuthForm>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title={t('auth.resetPasswordTitle')}
        subtitle={t('auth.resetPasswordSubtitle')}
        submitLabel={t('auth.resetPasswordButton')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void resetPasswordForm.handleSubmit(onSubmitResetPassword)(event)}
        isSubmitting={resetPasswordForm.formState.isSubmitting}
        errorMessage={apiError}
        footer={
          <button
            type="button"
            className="font-semibold text-brand-600 hover:text-brand-700"
            onClick={backToOtpFromReset}
          >
            {t('auth.backToOtpStep')}
          </button>
        }
      >
        {infoMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {infoMessage}
          </div>
        ) : null}

        <InputField
          label={t('auth.newPassword')}
          placeholder={t('auth.newPassword')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          registration={resetPasswordForm.register('newPassword', {
            required: t('auth.required'),
            minLength: {
              value: 8,
              message: t('auth.passwordMin'),
            },
          })}
          error={resetPasswordForm.formState.errors.newPassword?.message}
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

        <InputField
          label={t('auth.confirmNewPassword')}
          placeholder={t('auth.confirmNewPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          registration={resetPasswordForm.register('confirmNewPassword', {
            required: t('auth.required'),
            validate: (value) => value === resetPasswordForm.getValues('newPassword') || t('auth.passwordMatch'),
          })}
          error={resetPasswordForm.formState.errors.confirmNewPassword?.message}
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

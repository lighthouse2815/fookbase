import { Eye, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { AuthForm } from '@/components/auth/AuthForm';
import { InputField } from '@/components/auth/InputField';
import { useLogin } from '@/pages/auth/hooks/useLogin';

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

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
        <AuthForm
          title={t('auth.verifyEmailTitle')}
          subtitle={t('auth.verifyEmailSubtitle')}
          submitLabel={t('auth.verifyOtpButton')}
          loadingLabel={t('common.loading')}
          onSubmit={(event) => void otpForm.handleSubmit(onSubmitOtp)(event)}
          isSubmitting={otpForm.formState.isSubmitting}
          errorMessage={apiError}
          footer={
            <button
              type="button"
              className="font-semibold text-brand-600 hover:text-brand-700"
              onClick={goBackToLoginFromOtp}
            >
              {t('auth.redirectToLogin')}
            </button>
          }
        >
          <div className="flex justify-center">
            <img
              src="/pic_verify_email.jpg"
              alt={t('auth.verifyEmailTitle')}
              className="h-auto w-56 max-w-full rounded-xl object-contain sm:w-64 md:w-72"
              loading="lazy"
            />
          </div>

          {infoMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {infoMessage}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {t('auth.verifyingFor')}: <span className="font-semibold">{inactiveEmail}</span>
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

  if (step === 'banned') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 py-6">
        <div className="w-full max-w-5xl space-y-5 text-center">
          <h1 className="text-3xl font-black tracking-wide text-rose-500 sm:text-5xl">huhuhu bạn đã bị ban</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            {bannedMessage || 'Tai khoan cua ban da bi khoa va khong the dang nhap.'}
          </p>

          <div className="overflow-hidden rounded-2xl border border-rose-500/40 bg-black shadow-2xl">
            <video
              src="/bann_user.mp4"
              className="mx-auto h-auto max-h-[68vh] w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>

          <button
            type="button"
            onClick={goBackToLoginFromBanned}
            className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
          >
            Quay lai dang nhap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <AuthForm
        title={t('auth.loginTitle')}
        subtitle={t('auth.loginSubtitle')}
        submitLabel={t('auth.loginButton')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void loginForm.handleSubmit(onSubmitLogin)(event)}
        isSubmitting={loginForm.formState.isSubmitting}
        errorMessage={apiError}
        footer={
          <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">
            {t('auth.redirectToRegister')}
          </Link>
        }
      >
        {locationState?.message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {locationState.message}
          </div>
        ) : null}

        <InputField
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

        <InputField
          label={t('auth.password')}
          placeholder={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          registration={loginForm.register('password', {
            required: t('auth.required'),
          })}
          error={loginForm.formState.errors.password?.message}
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

        <button
          type="button"
          onClick={() => void onSubmitGoogle()}
          disabled={isGoogleSubmitting || loginForm.formState.isSubmitting}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {isGoogleSubmitting ? t('common.loading') : t('auth.googleButton')}
        </button>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...loginForm.register('rememberMe')}
            />
            {t('auth.rememberMe')}
          </label>

          <Link className="text-sm font-medium text-brand-600 hover:text-brand-700" to="/forgot-password">
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </AuthForm>
    </div>
  );
};

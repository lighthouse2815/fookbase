import { Eye, EyeOff } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { AuthForm } from '@/components/auth/AuthForm';
import { InputField } from '@/components/auth/InputField';
import { useRegister } from '@/pages/auth/hooks/useRegister';

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
  } = useRegister();

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
              onClick={backToRegister}
            >
              {t('auth.backToRegister')}
            </button>
          }
        >
          {infoMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {infoMessage}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {t('auth.verifyingFor')}: <span className="font-semibold">{registeredEmail}</span>
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
        title={t('auth.registerTitle')}
        subtitle={t('auth.registerSubtitle')}
        submitLabel={t('auth.registerButton')}
        loadingLabel={t('common.loading')}
        onSubmit={(event) => void registerForm.handleSubmit(onSubmitRegister)(event)}
        isSubmitting={registerForm.formState.isSubmitting}
        errorMessage={apiError}
        footer={
          <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">
            {t('auth.redirectToLogin')}
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t('auth.lastName')}
            placeholder={t('auth.lastName')}
            autoComplete="family-name"
            registration={registerForm.register('lastName', {
              required: t('auth.required'),
            })}
            error={registerForm.formState.errors.lastName?.message}
          />

          <InputField
            label={t('auth.firstName')}
            placeholder={t('auth.firstName')}
            autoComplete="given-name"
            registration={registerForm.register('firstName', {
              required: t('auth.required'),
            })}
            error={registerForm.formState.errors.firstName?.message}
          />
        </div>

        <InputField
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

        <InputField
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

        <div className="space-y-3">
          <InputField
            label={t('auth.password')}
            placeholder={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            registration={registerForm.register('password', {
              required: t('auth.required'),
              minLength: {
                value: 8,
                message: t('auth.passwordMin'),
              },
            })}
            error={registerForm.formState.errors.password?.message}
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

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t('auth.passwordStrength')}</span>
              <span>{strengthLabelMap[strength.label]}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all ${strengthColorMap[strength.label]}`}
                style={{ width: `${Math.max(20, (strength.score / 4) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <InputField
          label={t('auth.confirmPassword')}
          placeholder={t('auth.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          registration={registerForm.register('confirmPassword', {
            required: t('auth.required'),
            validate: (value) => value === registerForm.getValues('password') || t('auth.passwordMatch'),
          })}
          error={registerForm.formState.errors.confirmPassword?.message}
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

        <div className="space-y-1">
          <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...registerForm.register('acceptTerms', {
                validate: (value) => value || t('auth.acceptTermsRequired'),
              })}
            />
            <span>
              {t('auth.termsPrefix')}{' '}
              <a className="font-semibold text-brand-600 hover:text-brand-700" href="#" onClick={(event) => event.preventDefault()}>
                {t('auth.termsTitle')}
              </a>
            </span>
          </label>
          {registerForm.formState.errors.acceptTerms?.message ? (
            <p className="text-xs text-rose-500">{registerForm.formState.errors.acceptTerms.message}</p>
          ) : null}
        </div>
      </AuthForm>
    </div>
  );
};

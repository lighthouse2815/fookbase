import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AuthForm } from '../../components/auth/AuthForm';
import { InputField } from '../../components/auth/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { getApiErrorMessage } from '../../utils/apiError';

interface EmailFormValues {
  email: string;
}

interface OtpFormValues {
  otp: string;
}

interface ResetPasswordFormValues {
  newPassword: string;
  confirmNewPassword: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpPattern = /^[0-9]{4,8}$/;

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [infoMessage, setInfoMessage] = useState<string | undefined>();

  const emailForm = useForm<EmailFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    mode: 'onChange',
    defaultValues: {
      otp: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmitEmail = async (data: EmailFormValues) => {
    try {
      setApiError(undefined);
      const normalizedEmail = data.email.trim();
      const response = await authService.sendResetPasswordOtpWhenNotLogin({
        email: normalizedEmail,
        type: 'PASSWORD_RESET',
      });

      setEmail(normalizedEmail);
      setInfoMessage(response.result || t('auth.otpSent'));
      otpForm.reset({ otp: '' });
      setStep('otp');
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.sendOtpError')));
    }
  };

  const onSubmitOtp = async (data: OtpFormValues) => {
    try {
      setApiError(undefined);

      const response = await authService.verifyResetPasswordOtpWhenNotLogin({
        email,
        otp: data.otp.trim(),
      });

      const token = response.result?.trim();
      if (!token) {
        setApiError(t('auth.verifyOtpError'));
        return;
      }

      setResetToken(token);
      setInfoMessage(t('auth.otpVerifiedProceedReset'));
      resetPasswordForm.reset({
        newPassword: '',
        confirmNewPassword: '',
      });
      setStep('reset');
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.verifyOtpError')));
    }
  };

  const onSubmitResetPassword = async (data: ResetPasswordFormValues) => {
    if (!resetToken) {
      setApiError(t('auth.verifyOtpError'));
      setStep('otp');
      return;
    }

    try {
      setApiError(undefined);
      const response = await authService.resetPassword(resetToken, {
        newPassword: data.newPassword,
      });

      navigate('/login', {
        replace: true,
        state: {
          message: response.message || t('auth.resetPasswordSuccess'),
        },
      });
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.resetPasswordError')));
    }
  };

  const handleResendOtp = async () => {
    try {
      setApiError(undefined);
      const response = await authService.sendResetPasswordOtpWhenNotLogin({
        email,
        type: 'PASSWORD_RESET',
      });
      setInfoMessage(response.result || t('auth.otpSent'));
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.sendOtpError')));
    }
  };

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
              onClick={() => {
                setStep('email');
                setApiError(undefined);
              }}
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
            onClick={() => {
              setStep('otp');
              setApiError(undefined);
            }}
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

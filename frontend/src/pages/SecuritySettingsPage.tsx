import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { authService } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';

type Step = 'sendOtp' | 'verifyOtp' | 'resetPassword';

export const SecuritySettingsPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();

  const [step, setStep] = useState<Step>('sendOtp');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await authService.sendResetPasswordOtpWhenLogin();
      setInfoMessage(response.result || t('securitySettings.otpSentDefault'));
      setStep('verifyOtp');
      setOtp('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('securitySettings.sendOtpError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedOtp = otp.trim();
    if (!normalizedOtp) {
      setErrorMessage(t('securitySettings.otpRequired'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await authService.verifyResetPasswordOtpWhenLogin({
        email: '',
        otp: normalizedOtp,
      });

      const token = response.result?.trim();
      if (!token) {
        setErrorMessage(t('securitySettings.resetTokenMissing'));
        return;
      }

      setResetToken(token);
      setStep('resetPassword');
      setInfoMessage(t('securitySettings.otpVerified'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('securitySettings.verifyOtpError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      setErrorMessage(t('securitySettings.resetTokenMissingRetry'));
      setStep('verifyOtp');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t('securitySettings.passwordTooShort'));
      return;
    }

    if (confirmPassword !== newPassword) {
      setErrorMessage(t('securitySettings.passwordNotMatch'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await authService.resetPassword(resetToken, { newPassword });
      setInfoMessage(response.message || t('securitySettings.passwordChanged'));
      setStep('sendOtp');
      setResetToken('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('securitySettings.resetPasswordError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('securitySettings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('securitySettings.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('securitySettings.accountInfoTitle')}</h2>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('securitySettings.usernameLabel')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">@{currentUser.username}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('securitySettings.changePasswordTitle')}</h2>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200">
            {infoMessage}
          </p>
        ) : null}

        {step === 'sendOtp' ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void handleSendOtp()}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <KeyRound size={16} />
              {isSubmitting ? t('securitySettings.sendingButton') : t('securitySettings.sendOtpButton')}
            </button>
          </div>
        ) : null}

        {step === 'verifyOtp' ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('securitySettings.otpLabel')}
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder={t('securitySettings.otpPlaceholder')}
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={isSubmitting}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t('securitySettings.verifyingButton') : t('securitySettings.verifyOtpButton')}
              </button>
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t('securitySettings.resendOtpButton')}
              </button>
            </div>
          </div>
        ) : null}

        {step === 'resetPassword' ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('securitySettings.newPasswordLabel')}
              <div className="relative mt-1">
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder={t('securitySettings.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('securitySettings.confirmNewPasswordLabel')}
              <div className="relative mt-1">
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder={t('securitySettings.confirmNewPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={isSubmitting}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t('securitySettings.updatingButton') : t('securitySettings.updatePasswordButton')}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

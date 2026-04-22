import { Eye, EyeOff, KeyRound } from 'lucide-react';

import type { UseSecuritySettingsReturn } from '@/features/settings/types/hooks';

type SecurityPasswordSectionProps = Pick<
  UseSecuritySettingsReturn,
  | 't'
  | 'step'
  | 'otp'
  | 'setOtp'
  | 'newPassword'
  | 'setNewPassword'
  | 'confirmPassword'
  | 'setConfirmPassword'
  | 'isSubmitting'
  | 'showPassword'
  | 'setShowPassword'
  | 'showConfirmPassword'
  | 'setShowConfirmPassword'
  | 'errorMessage'
  | 'infoMessage'
  | 'handleSendOtp'
  | 'handleVerifyOtp'
  | 'handleResetPassword'
  | 'handleCancelPasswordFlow'
>;

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  label: string;
  placeholder: string;
  t: UseSecuritySettingsReturn['t'];
}

const PasswordInput = ({
  value,
  onChange,
  isVisible,
  onToggleVisibility,
  label,
  placeholder,
  t,
}: PasswordInputProps) => {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <div className="relative mt-1">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={isVisible ? 'text' : 'password'}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
          title={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
};

export const SecurityPasswordSection = ({
  t,
  step,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSubmitting,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  errorMessage,
  infoMessage,
  handleSendOtp,
  handleVerifyOtp,
  handleResetPassword,
  handleCancelPasswordFlow,
}: SecurityPasswordSectionProps) => {
  return (
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

          <div className="flex flex-wrap items-center gap-2">
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

            <button
              type="button"
              onClick={handleCancelPasswordFlow}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t('securitySettings.cancelButton')}
            </button>
          </div>
        </div>
      ) : null}

      {step === 'resetPassword' ? (
        <div className="mt-4 space-y-3">
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            isVisible={showPassword}
            onToggleVisibility={() => setShowPassword((value) => !value)}
            label={t('securitySettings.newPasswordLabel')}
            placeholder={t('securitySettings.newPasswordPlaceholder')}
            t={t}
          />

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            isVisible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
            label={t('securitySettings.confirmNewPasswordLabel')}
            placeholder={t('securitySettings.confirmNewPasswordPlaceholder')}
            t={t}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={isSubmitting}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t('securitySettings.updatingButton') : t('securitySettings.updatePasswordButton')}
            </button>

            <button
              type="button"
              onClick={handleCancelPasswordFlow}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t('securitySettings.cancelButton')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

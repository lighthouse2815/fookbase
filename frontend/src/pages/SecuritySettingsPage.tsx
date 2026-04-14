import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { getApiErrorMessage } from '../utils/apiError';

type Step = 'sendOtp' | 'verifyOtp' | 'resetPassword';
type SecurityFieldKey = 'username' | 'phoneNumber';
type SecurityEditStep = 'verifyOtp' | 'edit';

export const SecuritySettingsPage = () => {
  const { t } = useTranslation();

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
  const [securityUsername, setSecurityUsername] = useState<string>('user');
  const [securityEmail, setSecurityEmail] = useState<string | null>(null);
  const [securityPhoneNumber, setSecurityPhoneNumber] = useState<string | null>(null);
  const [showSecurityUsername, setShowSecurityUsername] = useState(false);
  const [showSecurityEmail, setShowSecurityEmail] = useState(false);
  const [showSecurityPhoneNumber, setShowSecurityPhoneNumber] = useState(false);
  const [isLoadingSecurityUsername, setIsLoadingSecurityUsername] = useState(true);
  const [securityUsernameError, setSecurityUsernameError] = useState<string | null>(null);
  const [isSendingEditOtp, setIsSendingEditOtp] = useState(false);
  const [editingField, setEditingField] = useState<SecurityFieldKey | null>(null);
  const [activeEditField, setActiveEditField] = useState<SecurityFieldKey | null>(null);
  const [activeEditStep, setActiveEditStep] = useState<SecurityEditStep | null>(null);
  const [editOtp, setEditOtp] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isVerifyingEditOtp, setIsVerifyingEditOtp] = useState(false);
  const [isUpdatingEditField, setIsUpdatingEditField] = useState(false);
  const [editOtpInfoMessage, setEditOtpInfoMessage] = useState<string | null>(null);
  const [editOtpErrorMessage, setEditOtpErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSecurityAccountInfo = async () => {
      setIsLoadingSecurityUsername(true);
      setSecurityUsernameError(null);

      try {
        const accountInfo = await userService.getSecurityAccountInfo();
        if (!isMounted) {
          return;
        }

        setSecurityUsername(accountInfo.username);
        setSecurityEmail(accountInfo.email);
        setSecurityPhoneNumber(accountInfo.phoneNumber);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSecurityEmail(null);
        setSecurityPhoneNumber(null);
        setSecurityUsernameError(
          getApiErrorMessage(error, t('securitySettings.accountInfoLoadError')),
        );
      } finally {
        if (isMounted) {
          setIsLoadingSecurityUsername(false);
        }
      }
    };

    void loadSecurityAccountInfo();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const maskSensitiveValue = (value: string) => {
    const maskLength = Math.max(8, Math.min(16, value.length));
    return '*'.repeat(maskLength);
  };

  const resolveSensitiveValue = (
    value: string | null,
    isVisible: boolean,
    options?: { prefix?: string },
  ) => {
    const normalized = value?.trim();

    if (!normalized) {
      return t('securitySettings.emptyValue');
    }

    if (isVisible) {
      return `${options?.prefix ?? ''}${normalized}`;
    }

    return maskSensitiveValue(normalized);
  };

  const getFieldLabel = (field: SecurityFieldKey) => {
    if (field === 'username') {
      return t('securitySettings.usernameLabel');
    }
    return t('securitySettings.phoneNumberLabel');
  };

  const getCurrentFieldValue = (field: SecurityFieldKey) => {
    if (field === 'username') {
      return securityUsername;
    }
    return securityPhoneNumber ?? '';
  };

  const resetEditFlow = () => {
    setActiveEditField(null);
    setActiveEditStep(null);
    setEditOtp('');
    setEditValue('');
    setEditOtpErrorMessage(null);
  };

  const handleSendEditOtp = async (field: SecurityFieldKey) => {
    setIsSendingEditOtp(true);
    setEditingField(field);
    setEditOtpErrorMessage(null);
    setEditOtpInfoMessage(null);

    try {
      if (field === 'username') {
        await authService.sendChangeUsernameOtpWhenLogin();
      } else {
        await authService.sendChangePhoneNumberOtpWhenLogin();
      }
      setEditOtpInfoMessage(
        t('securitySettings.editOtpSent', {
          field: getFieldLabel(field),
        }),
      );
      setActiveEditField(field);
      setActiveEditStep('verifyOtp');
      setEditOtp('');
      setEditValue(getCurrentFieldValue(field));
    } catch (error) {
      setEditOtpErrorMessage(getApiErrorMessage(error, t('securitySettings.editOtpSendError')));
    } finally {
      setIsSendingEditOtp(false);
      setEditingField(null);
    }
  };

  const handleVerifyEditOtp = async () => {
    if (!activeEditField) {
      return;
    }

    const normalizedOtp = editOtp.trim();
    if (!normalizedOtp) {
      setEditOtpErrorMessage(t('securitySettings.otpRequired'));
      return;
    }

    setIsVerifyingEditOtp(true);
    setEditOtpErrorMessage(null);
    setEditOtpInfoMessage(null);

    try {
      const payload = { otp: normalizedOtp };
      if (activeEditField === 'username') {
        await authService.verifyChangeUsernameOtpWhenLogin(payload);
      } else {
        await authService.verifyChangePhoneNumberOtpWhenLogin(payload);
      }

      setActiveEditStep('edit');
      setEditValue(getCurrentFieldValue(activeEditField));
      setEditOtpInfoMessage(
        t('securitySettings.editOtpVerified', {
          field: getFieldLabel(activeEditField),
        }),
      );
    } catch (error) {
      setEditOtpErrorMessage(getApiErrorMessage(error, t('securitySettings.verifyOtpError')));
    } finally {
      setIsVerifyingEditOtp(false);
    }
  };

  const handleUpdateEditField = async () => {
    if (!activeEditField) {
      return;
    }

    const normalizedOtp = editOtp.trim();
    if (!normalizedOtp) {
      setEditOtpErrorMessage(t('securitySettings.otpRequired'));
      return;
    }

    const normalizedValue = editValue.trim();
    if (!normalizedValue) {
      setEditOtpErrorMessage(t('securitySettings.fieldValueRequired'));
      return;
    }

    if (activeEditField === 'phoneNumber' && !/^0\d{9}$/.test(normalizedValue)) {
      setEditOtpErrorMessage(t('securitySettings.phoneNumberInvalid'));
      return;
    }

    setIsUpdatingEditField(true);
    setEditOtpErrorMessage(null);
    setEditOtpInfoMessage(null);

    try {
      if (activeEditField === 'username') {
        await userService.updateSecurityAccountInfo({
          otp: normalizedOtp,
          username: normalizedValue,
        });
        setSecurityUsername(normalizedValue);
      } else {
        await userService.updateSecurityAccountInfo({
          otp: normalizedOtp,
          phoneNumber: normalizedValue,
        });
        setSecurityPhoneNumber(normalizedValue);
      }

      setEditOtpInfoMessage(
        t('securitySettings.fieldUpdated', {
          field: getFieldLabel(activeEditField),
        }),
      );
      setEditOtpErrorMessage(null);
      resetEditFlow();
    } catch (error) {
      setEditOtpErrorMessage(getApiErrorMessage(error, t('securitySettings.updateFieldError')));
    } finally {
      setIsUpdatingEditField(false);
    }
  };

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
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('securitySettings.accountInfoOtpHint')}
        </p>
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('securitySettings.usernameLabel')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isLoadingSecurityUsername
                    ? t('common.loading')
                    : resolveSensitiveValue(securityUsername, showSecurityUsername, { prefix: '@' })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecurityUsername((value) => !value)}
                  aria-label={showSecurityUsername ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showSecurityUsername ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {showSecurityUsername ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendEditOtp('username')}
                  disabled={
                    isLoadingSecurityUsername
                    || isSendingEditOtp
                    || isVerifyingEditOtp
                    || isUpdatingEditField
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingEditOtp && editingField === 'username'
                    ? t('securitySettings.sendingButton')
                    : t('personalInfoSettings.editButton')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('securitySettings.emailLabel')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isLoadingSecurityUsername
                    ? t('common.loading')
                    : resolveSensitiveValue(securityEmail, showSecurityEmail)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecurityEmail((value) => !value)}
                  aria-label={showSecurityEmail ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showSecurityEmail ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {showSecurityEmail ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  disabled
                  title={t('securitySettings.emailEditDisabledHint')}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                >
                  {t('personalInfoSettings.editButton')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('securitySettings.phoneNumberLabel')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {isLoadingSecurityUsername
                    ? t('common.loading')
                    : resolveSensitiveValue(securityPhoneNumber, showSecurityPhoneNumber)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecurityPhoneNumber((value) => !value)}
                  aria-label={showSecurityPhoneNumber ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showSecurityPhoneNumber ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {showSecurityPhoneNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendEditOtp('phoneNumber')}
                  disabled={
                    isLoadingSecurityUsername
                    || isSendingEditOtp
                    || isVerifyingEditOtp
                    || isUpdatingEditField
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingEditOtp && editingField === 'phoneNumber'
                    ? t('securitySettings.sendingButton')
                    : t('personalInfoSettings.editButton')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeEditField && activeEditStep ? (
          <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/40 dark:bg-brand-500/10">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
              {t('securitySettings.editFieldTitle', { field: getFieldLabel(activeEditField) })}
            </p>

            {activeEditStep === 'verifyOtp' ? (
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('securitySettings.otpLabel')}
                  <input
                    value={editOtp}
                    onChange={(event) => setEditOtp(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder={t('securitySettings.otpPlaceholder')}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleVerifyEditOtp()}
                    disabled={isVerifyingEditOtp || isUpdatingEditField}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isVerifyingEditOtp ? t('securitySettings.verifyingButton') : t('securitySettings.verifyOtpButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSendEditOtp(activeEditField)}
                    disabled={isSendingEditOtp || isVerifyingEditOtp || isUpdatingEditField}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {t('securitySettings.resendOtpButton')}
                  </button>
                  <button
                    type="button"
                    onClick={resetEditFlow}
                    disabled={isSendingEditOtp || isVerifyingEditOtp || isUpdatingEditField}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {t('securitySettings.cancelButton')}
                  </button>
                </div>
              </div>
            ) : null}

            {activeEditStep === 'edit' ? (
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {getFieldLabel(activeEditField)}
                  <input
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder={
                      activeEditField === 'username'
                        ? t('securitySettings.newUsernamePlaceholder')
                        : t('securitySettings.newPhoneNumberPlaceholder')
                    }
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleUpdateEditField()}
                    disabled={isUpdatingEditField || isVerifyingEditOtp}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingEditField ? t('securitySettings.updatingButton') : t('securitySettings.updateFieldButton')}
                  </button>
                  <button
                    type="button"
                    onClick={resetEditFlow}
                    disabled={isUpdatingEditField || isVerifyingEditOtp}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {t('securitySettings.cancelButton')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {editOtpErrorMessage ? (
          <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
            {editOtpErrorMessage}
          </p>
        ) : null}

        {editOtpInfoMessage ? (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
            {editOtpInfoMessage}
          </p>
        ) : null}

        {securityUsernameError ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            {securityUsernameError}
          </p>
        ) : null}
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
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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

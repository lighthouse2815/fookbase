import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authService } from '@/services/auth/authService';
import { userService } from '@/services/user/userService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { UseSecuritySettingsReturn } from '../interface';
import type { SecurityEditStep, SecurityFieldKey, SecurityPasswordStep } from '../type';

export const useSecuritySettings = (): UseSecuritySettingsReturn => {
  const { t } = useTranslation();

  const [step, setStep] = useState<SecurityPasswordStep>('sendOtp');
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

  const handleCancelPasswordFlow = () => {
    setStep('sendOtp');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
    setInfoMessage(null);
  };

  return {
    t,
    step,
    otp,
    setOtp,
    resetToken,
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
    securityUsername,
    securityEmail,
    securityPhoneNumber,
    showSecurityUsername,
    setShowSecurityUsername,
    showSecurityEmail,
    setShowSecurityEmail,
    showSecurityPhoneNumber,
    setShowSecurityPhoneNumber,
    isLoadingSecurityUsername,
    securityUsernameError,
    isSendingEditOtp,
    editingField,
    activeEditField,
    activeEditStep,
    editOtp,
    setEditOtp,
    editValue,
    setEditValue,
    isVerifyingEditOtp,
    isUpdatingEditField,
    editOtpInfoMessage,
    editOtpErrorMessage,
    resolveSensitiveValue,
    getFieldLabel,
    resetEditFlow,
    handleSendEditOtp,
    handleVerifyEditOtp,
    handleUpdateEditField,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    handleCancelPasswordFlow,
  };
};

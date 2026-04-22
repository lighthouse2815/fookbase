import type { TFunction } from 'i18next';
import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';
import { authService } from '@/features/auth/api/service/authService';

import type { SecurityPasswordStep } from '@/features/settings/types/pages';

export const useSecurityPasswordFlow = (t: TFunction) => {
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
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    handleCancelPasswordFlow,
  };
};

export type UseSecurityPasswordFlowReturn = ReturnType<typeof useSecurityPasswordFlow>;

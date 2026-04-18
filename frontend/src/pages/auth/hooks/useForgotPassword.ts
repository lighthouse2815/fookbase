import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';

import type {
  ForgotPasswordEmailFormValues,
  ForgotPasswordOtpFormValues,
  ForgotPasswordResetFormValues,
} from '@/pages/auth/interface';
import type { ForgotPasswordStep } from '@/pages/auth/type';
import { AUTH_EMAIL_PATTERN, AUTH_OTP_PATTERN } from '@/pages/auth/util';

export const useForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [infoMessage, setInfoMessage] = useState<string | undefined>();

  const emailForm = useForm<ForgotPasswordEmailFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<ForgotPasswordOtpFormValues>({
    mode: 'onChange',
    defaultValues: {
      otp: '',
    },
  });

  const resetPasswordForm = useForm<ForgotPasswordResetFormValues>({
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmitEmail = async (data: ForgotPasswordEmailFormValues) => {
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

  const onSubmitOtp = async (data: ForgotPasswordOtpFormValues) => {
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

  const onSubmitResetPassword = async (data: ForgotPasswordResetFormValues) => {
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

  const backToEmailStep = () => {
    setStep('email');
    setApiError(undefined);
  };

  const backToOtpFromReset = () => {
    setStep('otp');
    setApiError(undefined);
  };

  return {
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
    emailPattern: AUTH_EMAIL_PATTERN,
    otpPattern: AUTH_OTP_PATTERN,
    onSubmitEmail,
    onSubmitOtp,
    onSubmitResetPassword,
    handleResendOtp,
    backToEmailStep,
    backToOtpFromReset,
  };
};

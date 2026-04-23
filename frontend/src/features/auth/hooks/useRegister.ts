import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useAuthSuccessTransition } from '@/features/auth/contexts/AuthSuccessTransitionContext';
import { getGoogleWebClientId, requestGoogleIdToken } from '@/shared/lib/googleIdentity';
import { authService } from '@/features/auth/api/service/authService';
import { BannedAccountError } from '@/features/auth/errors/BannedAccountError';
import { getApiErrorMessage } from '@/shared/api/error';
import { getPasswordStrength } from '@/features/auth/utils/passwordStrength';

import type {
  RegisterFormValues,
  RegisterOtpFormValues,
  RegisterStep,
} from '@/features/auth/types/hooks';
import {
  AUTH_EMAIL_PATTERN,
  AUTH_OTP_PATTERN,
  AUTH_PHONE_PATTERN,
  getRegisterPasswordStrengthLabels,
  REGISTER_PASSWORD_STRENGTH_COLORS,
} from '@/features/auth/utils/form.util';

export const useRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, authWithGoogle, isAuthenticated } = useAuth();
  const { playSuccessTransition } = useAuthSuccessTransition();

  const [step, setStep] = useState<RegisterStep>('register');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [infoMessage, setInfoMessage] = useState<string | undefined>();

  const registerForm = useForm<RegisterFormValues>({
    mode: 'onChange',
    defaultValues: {
      phone: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const otpForm = useForm<RegisterOtpFormValues>({
    mode: 'onChange',
    defaultValues: {
      otp: '',
    },
  });

  const passwordValue = useWatch({
    control: registerForm.control,
    name: 'password',
    defaultValue: '',
  });
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);
  const strengthLabelMap = useMemo(() => getRegisterPasswordStrengthLabels(t), [t]);
  const strengthColorMap = REGISTER_PASSWORD_STRENGTH_COLORS;

  const sendVerifyOtp = async (email: string) => {
    const response = await authService.sendVerifyEmailOtpWhenNotLogin({
      email,
      type: 'EMAIL_VERIFY',
    });

    setInfoMessage(response.result || t('auth.otpSent'));
  };

  const onSubmitRegister = async (data: RegisterFormValues) => {
    try {
      setApiError(undefined);
      setInfoMessage(undefined);

      await registerUser({
        username: data.phone.trim(),
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password,
      });

      setRegisteredEmail(data.email.trim());
      otpForm.reset({ otp: '' });
      setStep('otp');

      await sendVerifyOtp(data.email.trim());
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.registerError')));
    }
  };

  const onSubmitOtp = async (data: RegisterOtpFormValues) => {
    if (!registeredEmail) {
      setApiError(t('auth.registerAgain'));
      setStep('register');
      return;
    }

    try {
      setApiError(undefined);
      const response = await authService.verifyEmailOtpWhenNotLogin({
        email: registeredEmail,
        otp: data.otp.trim(),
      });

      navigate('/login', {
        replace: true,
        state: {
          message: response.result || t('auth.verifyEmailSuccess'),
        },
      });
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.verifyOtpError')));
    }
  };

  const handleResendOtp = async () => {
    if (!registeredEmail) {
      setApiError(t('auth.registerAgain'));
      return;
    }

    try {
      setApiError(undefined);
      await sendVerifyOtp(registeredEmail);
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.sendOtpError')));
    }
  };

  const backToRegister = () => {
    setStep('register');
    setApiError(undefined);
    setInfoMessage(undefined);
  };

  const onSubmitGoogle = async () => {
    const clientId = getGoogleWebClientId();
    if (!clientId) {
      setApiError(t('auth.googleNotConfigured'));
      return;
    }

    try {
      setApiError(undefined);
      setInfoMessage(undefined);
      setIsGoogleSubmitting(true);

      const tokenId = await requestGoogleIdToken(clientId);
      await authWithGoogle(tokenId, true);
      playSuccessTransition({
        tone: 'user',
        onNavigate: () => {
          navigate('/', { replace: true });
        },
      });
    } catch (error) {
      if (error instanceof BannedAccountError) {
        setApiError(error.message);
        return;
      }

      setApiError(getApiErrorMessage(error, t('auth.googleRegisterError')));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return {
    t,
    isAuthenticated,
    step,
    registeredEmail,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isGoogleSubmitting,
    apiError,
    infoMessage,
    registerForm,
    otpForm,
    strength,
    strengthLabelMap,
    strengthColorMap,
    emailPattern: AUTH_EMAIL_PATTERN,
    phonePattern: AUTH_PHONE_PATTERN,
    otpPattern: AUTH_OTP_PATTERN,
    onSubmitRegister,
    onSubmitOtp,
    handleResendOtp,
    backToRegister,
    onSubmitGoogle,
  };
};




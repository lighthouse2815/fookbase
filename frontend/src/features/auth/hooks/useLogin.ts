import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useAuthSuccessTransition } from '@/features/auth/contexts/AuthSuccessTransitionContext';
import { authService } from '@/features/auth/api/service/authService';
import { BannedAccountError } from '@/features/auth/errors/BannedAccountError';
import { InactiveAccountError } from '@/features/auth/errors/InactiveAccountError';
import { getGoogleWebClientId, requestGoogleIdToken } from '@/shared/lib/googleIdentity';
import { getApiErrorMessage } from '@/shared/api/error';

import type {
  LoginFormValues,
  LoginLocationState,
  LoginOtpFormValues,
  LoginStep,
} from '@/features/auth/types/hooks';
import { AUTH_IDENTIFIER_PATTERN, AUTH_OTP_PATTERN } from '@/features/auth/utils/form.util';

export const useLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authWithGoogle, isAuthenticated } = useAuth();
  const { playSuccessTransition, isTransitioning } = useAuthSuccessTransition();
  const locationState = location.state as LoginLocationState | null;

  const [step, setStep] = useState<LoginStep>('login');
  const [pendingLogin, setPendingLogin] = useState<LoginFormValues | null>(null);
  const [inactiveEmail, setInactiveEmail] = useState<string>('');
  const [bannedMessage, setBannedMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [infoMessage, setInfoMessage] = useState<string | undefined>();

  const loginForm = useForm<LoginFormValues>({
    mode: 'onTouched',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: true,
    },
  });

  const otpForm = useForm<LoginOtpFormValues>({
    mode: 'onTouched',
    defaultValues: {
      otp: '',
    },
  });

  const destination = locationState?.from?.pathname ?? '/';

  const navigateWithSuccessTransition = (target: string) => {
    playSuccessTransition({
      tone: 'user',
      onNavigate: () => {
        navigate(target, { replace: true });
        setIsCompletingLogin(false);
      },
    });
  };

  const sendVerifyOtp = async (email: string) => {
    const response = await authService.sendVerifyEmailOtpWhenNotLogin({
      email,
      type: 'EMAIL_VERIFY',
    });

    setInfoMessage(response.result || t('auth.otpSent'));
  };

  const onSubmitLogin = async (data: LoginFormValues) => {
    try {
      setApiError(undefined);
      setInfoMessage(undefined);
      setIsCompletingLogin(true);
      await login(data);
      navigateWithSuccessTransition(destination);
    } catch (error) {
      setIsCompletingLogin(false);
      if (error instanceof InactiveAccountError) {
        if (!error.email) {
          setApiError(t('auth.sendOtpError'));
          return;
        }

        setPendingLogin(data);
        setInactiveEmail(error.email);
        otpForm.reset({ otp: '' });
        setStep('otp');

        try {
          await sendVerifyOtp(error.email);
        } catch (otpError) {
          setApiError(getApiErrorMessage(otpError, t('auth.sendOtpError')));
        }

        return;
      }

      if (error instanceof BannedAccountError) {
        setBannedMessage(error.message);
        setStep('banned');
        return;
      }

      setApiError(getApiErrorMessage(error, t('auth.loginError')));
    }
  };

  const onSubmitOtp = async (data: LoginOtpFormValues) => {
    if (!inactiveEmail || !pendingLogin) {
      setIsCompletingLogin(false);
      setStep('login');
      setApiError(t('auth.loginError'));
      return;
    }

    try {
      setApiError(undefined);
      setIsCompletingLogin(true);
      await authService.verifyEmailOtpWhenNotLogin({
        email: inactiveEmail,
        otp: data.otp.trim(),
      });

      await login(pendingLogin);
      navigateWithSuccessTransition(destination);
    } catch (error) {
      setIsCompletingLogin(false);
      setApiError(getApiErrorMessage(error, t('auth.verifyOtpError')));
    }
  };

  const handleResendOtp = async () => {
    if (!inactiveEmail) {
      setApiError(t('auth.sendOtpError'));
      return;
    }

    try {
      setApiError(undefined);
      await sendVerifyOtp(inactiveEmail);
    } catch (error) {
      setApiError(getApiErrorMessage(error, t('auth.sendOtpError')));
    }
  };

  const goBackToLoginFromOtp = () => {
    setStep('login');
    setApiError(undefined);
    setInfoMessage(undefined);
  };

  const goBackToLoginFromBanned = () => {
    setStep('login');
    setBannedMessage('');
    setApiError(undefined);
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
      setIsCompletingLogin(true);

      const tokenId = await requestGoogleIdToken(clientId);
      await authWithGoogle(tokenId, loginForm.getValues('rememberMe'));
      navigateWithSuccessTransition(destination);
    } catch (error) {
      setIsCompletingLogin(false);
      if (error instanceof BannedAccountError) {
        setBannedMessage(error.message);
        setStep('banned');
        return;
      }

      setApiError(getApiErrorMessage(error, t('auth.googleLoginError')));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return {
    t,
    isAuthenticated,
    isTransitioning,
    isCompletingLogin,
    step,
    locationState,
    destination,
    apiError,
    infoMessage,
    loginForm,
    otpForm,
    showPassword,
    setShowPassword,
    isGoogleSubmitting,
    inactiveEmail,
    bannedMessage,
    identifierPattern: AUTH_IDENTIFIER_PATTERN,
    otpPattern: AUTH_OTP_PATTERN,
    onSubmitLogin,
    onSubmitOtp,
    handleResendOtp,
    goBackToLoginFromOtp,
    goBackToLoginFromBanned,
    onSubmitGoogle,
  };
};




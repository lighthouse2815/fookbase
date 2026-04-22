import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';
import { userService } from '@/features/user/api/service/userService';

import type { SecurityFieldKey } from '@/features/settings/types/pages';

const maskSensitiveValue = (value: string) => {
  const maskLength = Math.max(8, Math.min(16, value.length));
  return '*'.repeat(maskLength);
};

export const useSecurityAccountInfo = (t: TFunction) => {
  const [securityUsername, setSecurityUsername] = useState<string>('user');
  const [securityEmail, setSecurityEmail] = useState<string | null>(null);
  const [securityPhoneNumber, setSecurityPhoneNumber] = useState<string | null>(null);
  const [showSecurityUsername, setShowSecurityUsername] = useState(false);
  const [showSecurityEmail, setShowSecurityEmail] = useState(false);
  const [showSecurityPhoneNumber, setShowSecurityPhoneNumber] = useState(false);
  const [isLoadingSecurityUsername, setIsLoadingSecurityUsername] = useState(true);
  const [securityUsernameError, setSecurityUsernameError] = useState<string | null>(null);

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
        setSecurityUsernameError(getApiErrorMessage(error, t('securitySettings.accountInfoLoadError')));
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

  const applyFieldValue = (field: SecurityFieldKey, value: string) => {
    if (field === 'username') {
      setSecurityUsername(value);
      return;
    }

    setSecurityPhoneNumber(value);
  };

  return {
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
    resolveSensitiveValue,
    getFieldLabel,
    getCurrentFieldValue,
    applyFieldValue,
  };
};

export type UseSecurityAccountInfoReturn = ReturnType<typeof useSecurityAccountInfo>;

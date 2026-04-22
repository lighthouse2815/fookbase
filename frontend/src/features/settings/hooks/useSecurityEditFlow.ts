import type { TFunction } from 'i18next';
import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';
import { authService } from '@/features/auth/api/service/authService';
import { userService } from '@/features/user/api/service/userService';

import type { SecurityFieldKey } from '@/features/settings/types/pages';

interface UseSecurityEditFlowParams {
  t: TFunction;
  getFieldLabel: (field: SecurityFieldKey) => string;
  getCurrentFieldValue: (field: SecurityFieldKey) => string;
  applyFieldValue: (field: SecurityFieldKey, value: string) => void;
}

export const useSecurityEditFlow = ({
  t,
  getFieldLabel,
  getCurrentFieldValue,
  applyFieldValue,
}: UseSecurityEditFlowParams) => {
  const [isSendingEditOtp, setIsSendingEditOtp] = useState(false);
  const [editingField, setEditingField] = useState<SecurityFieldKey | null>(null);
  const [activeEditField, setActiveEditField] = useState<SecurityFieldKey | null>(null);
  const [activeEditStep, setActiveEditStep] = useState<'verifyOtp' | 'edit' | null>(null);
  const [editOtp, setEditOtp] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isVerifyingEditOtp, setIsVerifyingEditOtp] = useState(false);
  const [isUpdatingEditField, setIsUpdatingEditField] = useState(false);
  const [editOtpInfoMessage, setEditOtpInfoMessage] = useState<string | null>(null);
  const [editOtpErrorMessage, setEditOtpErrorMessage] = useState<string | null>(null);

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
      const response = activeEditField === 'username'
        ? await authService.verifyChangeUsernameOtpWhenLogin(payload)
        : await authService.verifyChangePhoneNumberOtpWhenLogin(payload);

      const verificationToken = response.result?.trim();
      if (!verificationToken) {
        setEditOtpErrorMessage(t('securitySettings.verifyOtpError'));
        return;
      }

      setEditOtp(verificationToken);
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

    const verificationToken = editOtp.trim();
    if (!verificationToken) {
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
        await userService.updateSecurityAccountInfo(verificationToken, {
          username: normalizedValue,
        });
      } else {
        await userService.updateSecurityAccountInfo(verificationToken, {
          phoneNumber: normalizedValue,
        });
      }

      applyFieldValue(activeEditField, normalizedValue);
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

  return {
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
    resetEditFlow,
    handleSendEditOtp,
    handleVerifyEditOtp,
    handleUpdateEditField,
  };
};

export type UseSecurityEditFlowReturn = ReturnType<typeof useSecurityEditFlow>;

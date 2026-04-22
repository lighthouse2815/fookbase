import { useTranslation } from 'react-i18next';

import { useSecurityAccountInfo } from '@/features/settings/hooks/useSecurityAccountInfo';
import { useSecurityEditFlow } from '@/features/settings/hooks/useSecurityEditFlow';
import { useSecurityPasswordFlow } from '@/features/settings/hooks/useSecurityPasswordFlow';

import type { UseSecuritySettingsReturn } from '@/features/settings/types/hooks';

export const useSecuritySettings = (): UseSecuritySettingsReturn => {
  const { t } = useTranslation();

  const accountInfo = useSecurityAccountInfo(t);
  const editFlow = useSecurityEditFlow({
    t,
    getFieldLabel: accountInfo.getFieldLabel,
    getCurrentFieldValue: accountInfo.getCurrentFieldValue,
    applyFieldValue: accountInfo.applyFieldValue,
  });
  const passwordFlow = useSecurityPasswordFlow(t);

  return {
    t,
    ...passwordFlow,
    securityUsername: accountInfo.securityUsername,
    securityEmail: accountInfo.securityEmail,
    securityPhoneNumber: accountInfo.securityPhoneNumber,
    showSecurityUsername: accountInfo.showSecurityUsername,
    setShowSecurityUsername: accountInfo.setShowSecurityUsername,
    showSecurityEmail: accountInfo.showSecurityEmail,
    setShowSecurityEmail: accountInfo.setShowSecurityEmail,
    showSecurityPhoneNumber: accountInfo.showSecurityPhoneNumber,
    setShowSecurityPhoneNumber: accountInfo.setShowSecurityPhoneNumber,
    isLoadingSecurityUsername: accountInfo.isLoadingSecurityUsername,
    securityUsernameError: accountInfo.securityUsernameError,
    ...editFlow,
    resolveSensitiveValue: accountInfo.resolveSensitiveValue,
    getFieldLabel: accountInfo.getFieldLabel,
  };
};

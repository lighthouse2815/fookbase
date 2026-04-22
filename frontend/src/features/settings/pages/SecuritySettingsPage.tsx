import { SecurityAccountInfoSection } from '@/features/settings/components/SecurityAccountInfoSection';
import { SecurityPasswordSection } from '@/features/settings/components/SecurityPasswordSection';
import { SecuritySettingsHeader } from '@/features/settings/components/SecuritySettingsHeader';

import { useSecuritySettings } from '@/features/settings/hooks/useSecuritySettings';

export const SecuritySettingsPage = () => {
  const securitySettings = useSecuritySettings();
  const { t } = securitySettings;

  return (
    <div className="space-y-4">
      <SecuritySettingsHeader t={t} />
      <SecurityAccountInfoSection {...securitySettings} />
      <SecurityPasswordSection {...securitySettings} />
    </div>
  );
};

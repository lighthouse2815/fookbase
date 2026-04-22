import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProfileInfoVisibility, ProfilePageInfoSettings } from '@/features/profile/types/contracts';
import { profileService } from '@/features/profile/api/service/profileService';
import { getApiErrorMessage } from '@/shared/api/error';
import type { UseProfilePageInfoSettingsPageReturn } from '@/features/settings/types/hooks';

const DEFAULT_VISIBILITY: ProfileInfoVisibility = {
  fullNameVisible: true,
  phoneVisible: true,
  emailVisible: true,
  dateOfBirthVisible: true,
  genderVisible: true,
  friendCountVisible: true,
};

const areAllFieldsVisible = (visibility: ProfileInfoVisibility): boolean =>
  Object.values(visibility).every(Boolean);

const buildAllVisibility = (value: boolean): ProfileInfoVisibility => ({
  fullNameVisible: value,
  phoneVisible: value,
  emailVisible: value,
  dateOfBirthVisible: value,
  genderVisible: value,
  friendCountVisible: value,
});

const formatGender = (
  value: string | null | undefined,
  emptyValue: string,
  male: string,
  female: string,
  other: string,
): string => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return emptyValue;
  }

  if (normalized === 'MALE') {
    return male;
  }

  if (normalized === 'FEMALE') {
    return female;
  }

  if (normalized === 'OTHER') {
    return other;
  }

  return value?.trim() || emptyValue;
};

const formatBirthDate = (value: string | null | undefined, emptyValue: string, locale: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return emptyValue;
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return normalized;
  }

  return new Intl.DateTimeFormat(locale).format(new Date(timestamp));
};

const maskPhone = (value: string | null | undefined, emptyValue: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return emptyValue;
  }

  if (normalized.includes('*')) {
    return normalized;
  }

  if (normalized.length < 7) {
    return '****';
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
};

const maskEmail = (value: string | null | undefined, emptyValue: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return emptyValue;
  }

  if (normalized.includes('*')) {
    return normalized;
  }

  const at = normalized.indexOf('@');
  if (at <= 2) {
    return `****${normalized.slice(Math.max(at, 0))}`;
  }

  return `${normalized.slice(0, 2)}****${normalized.slice(at)}`;
};

export const useProfilePageInfoSettingsPage = (): UseProfilePageInfoSettingsPageReturn => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<ProfilePageInfoSettings | null>(null);
  const [visibility, setVisibility] = useState<ProfileInfoVisibility>(DEFAULT_VISIBILITY);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const emptyValue = t('profilePageInfoSettings.emptyValue');
  const currentLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
    let isCancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [data, visibilityData] = await Promise.all([
          profileService.getMyProfilePageInfoSettings(),
          profileService.getMyProfilePageInfoVisibility(),
        ]);

        if (isCancelled) {
          return;
        }

        setSettings(data);
        setVisibility(visibilityData);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(getApiErrorMessage(error, t('profilePageInfoSettings.loadError')));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [t]);

  const updateVisibility = async (nextVisibility: ProfileInfoVisibility) => {
    if (!settings) {
      return;
    }

    const previousVisibility = visibility;
    setVisibility(nextVisibility);
    setErrorMessage(null);
    setIsUpdatingVisibility(true);

    try {
      await profileService.updateMyProfilePageInfoVisibility(nextVisibility);
    } catch (error) {
      setVisibility(previousVisibility);
      setErrorMessage(getApiErrorMessage(error, t('profilePageInfoSettings.updateVisibilityError')));
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleToggleField = (field: keyof ProfileInfoVisibility) => {
    if (!settings || isUpdatingVisibility) {
      return;
    }

    const nextVisibility: ProfileInfoVisibility = {
      ...visibility,
      [field]: !visibility[field],
    };

    void updateVisibility(nextVisibility);
  };

  const handleToggleAll = () => {
    if (!settings || isUpdatingVisibility) {
      return;
    }

    const allVisible = areAllFieldsVisible(visibility);
    const nextVisibility = buildAllVisibility(!allVisible);
    void updateVisibility(nextVisibility);
  };

  const allVisible = areAllFieldsVisible(visibility);
  const fullNameValue = settings?.fullName?.trim() || emptyValue;
  const phoneValue = showPhone
    ? settings?.phoneNumber?.trim() || emptyValue
    : maskPhone(settings?.phoneNumber, emptyValue);
  const emailValue = showEmail
    ? settings?.email?.trim() || emptyValue
    : maskEmail(settings?.email, emptyValue);
  const dateOfBirthValue = formatBirthDate(settings?.dateOfBirth, emptyValue, currentLocale);
  const genderValue = formatGender(
    settings?.gender,
    emptyValue,
    t('profilePageInfoSettings.genderMale'),
    t('profilePageInfoSettings.genderFemale'),
    t('profilePageInfoSettings.genderOther'),
  );
  const friendCountValue = typeof settings?.friendCount === 'number' ? settings.friendCount : 0;

  const toggleShowPhone = () => {
    setShowPhone((current) => !current);
  };

  const toggleShowEmail = () => {
    setShowEmail((current) => !current);
  };

  return {
    t,
    visibility,
    isLoading,
    isUpdatingVisibility,
    errorMessage,
    showPhone,
    showEmail,
    allVisible,
    fullNameValue,
    phoneValue,
    emailValue,
    dateOfBirthValue,
    genderValue,
    friendCountValue,
    toggleShowPhone,
    toggleShowEmail,
    handleToggleField,
    handleToggleAll,
  };
};


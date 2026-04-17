import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCornerToast } from '@/hooks/useCornerToast';
import type { MyProfileSettings, UpdateMyProfileRequest } from '@/interface/profile';
import { cloudinaryService } from '@/services/cloudinaryService';
import { profileService } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { PersonalInfoFormState, UsePersonalInfoSettingsReturn } from '../interface';
import {
  EMPTY_PERSONAL_INFO_FORM,
  isImageFile,
  normalizePersonalInfoGender,
  toFallbackAvatarUrl,
} from '../util';

export const usePersonalInfoSettings = (): UsePersonalInfoSettingsReturn => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<MyProfileSettings | null>(null);
  const [form, setForm] = useState(EMPTY_PERSONAL_INFO_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast } = useCornerToast();

  useEffect(() => {
    let isCancelled = false;

    const loadMyProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await profileService.getMyProfileSettings();
        if (isCancelled) {
          return;
        }

        setProfile(data);
        setForm({
          displayName: data.displayName ?? '',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          birthday: data.birthDate ?? '',
          gender: normalizePersonalInfoGender(data.gender),
          avatarUrl: data.avatarUrl ?? '',
        });
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(getApiErrorMessage(error, t('personalInfoSettings.loadError')));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMyProfile();

    return () => {
      isCancelled = true;
    };
  }, [t]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleFieldChange = (field: keyof PersonalInfoFormState, value: string) => {
    if (!isEditing) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAvatarPicker = () => {
    if (!isEditing || isSaving) {
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (file: File | null) => {
    if (!file || !isEditing) {
      return;
    }

    if (!isImageFile(file)) {
      setErrorMessage(t('personalInfoSettings.invalidImageFile'));
      showToast(t('personalInfoSettings.invalidImageFile'), 'error');
      return;
    }

    setSelectedAvatarFile(file);
    setErrorMessage(null);

    setAvatarPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!isEditing || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let uploadedAvatarUrl: string | undefined;
      if (selectedAvatarFile) {
        uploadedAvatarUrl = await cloudinaryService.uploadMedia(selectedAvatarFile);
      }

      const payload: UpdateMyProfileRequest = {
        displayName: form.displayName.trim() || undefined,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        birthday: form.birthday.trim() || undefined,
        gender: form.gender.trim() || undefined,
        avatarUrl: uploadedAvatarUrl || undefined,
      };

      await profileService.updateMyProfile(payload);

      const refreshed = await profileService.getMyProfileSettings();
      setProfile(refreshed);
      setForm((previous) => ({
        ...previous,
        displayName: refreshed.displayName ?? previous.displayName,
        firstName: refreshed.firstName ?? previous.firstName,
        lastName: refreshed.lastName ?? previous.lastName,
        birthday: refreshed.birthDate ?? previous.birthday,
        gender: normalizePersonalInfoGender(refreshed.gender) || previous.gender,
        avatarUrl: refreshed.avatarUrl ?? previous.avatarUrl,
      }));
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }

        return null;
      });

      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }

      showToast(t('personalInfoSettings.updateSuccess'), 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, t('personalInfoSettings.updateError'));
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSource =
    avatarPreviewUrl
    || form.avatarUrl.trim()
    || profile?.avatarUrl?.trim()
    || toFallbackAvatarUrl(profile?.userId);

  return {
    t,
    profile,
    form,
    isLoading,
    isSaving,
    isEditing,
    setIsEditing,
    errorMessage,
    avatarInputRef,
    toast,
    handleFieldChange,
    openAvatarPicker,
    handleAvatarFileChange,
    handleSave,
    avatarSource,
  };
};

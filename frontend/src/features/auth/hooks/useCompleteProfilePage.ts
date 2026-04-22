import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { cloudinaryService } from '@/shared/services/cloudinary/cloudinaryService';
import { profileService } from '@/features/profile/api/service/profileService';
import { getApiErrorMessage } from '@/shared/api/error';
import type { CompleteProfileFormState } from '@/features/auth/types/pages';

const EMPTY_FORM: CompleteProfileFormState = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  displayName: '',
  birthday: '',
  gender: '',
  avatarUrl: '',
};

const PHONE_PATTERN = /^0\d{9}$/;

const normalizeGender = (value?: string | null): string => value?.trim().toUpperCase() ?? '';
const toFallbackAvatarUrl = () => 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';
const isImageFile = (file: File) => file.type.trim().toLowerCase().startsWith('image/');

export const maxBirthDate = new Date().toISOString().slice(0, 10);

export const useCompleteProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isInitializing,
    requiresProfileCompletion,
    markProfileCompleted,
    completeProfileMode,
    completeProfilePrefill,
  } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<CompleteProfileFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast, showToast } = useCornerToast();

  const isGoogleCompletion = completeProfileMode === 'google';

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await profileService.getMyProfileSettings();
        if (isCancelled) {
          return;
        }

        setForm({
          firstName: completeProfilePrefill?.firstName ?? profile.firstName ?? '',
          lastName: completeProfilePrefill?.lastName ?? profile.lastName ?? '',
          phoneNumber: completeProfilePrefill?.phoneNumber ?? profile.phoneNumber ?? '',
          email: completeProfilePrefill?.email ?? profile.email ?? '',
          displayName: completeProfilePrefill?.displayName ?? profile.displayName ?? '',
          birthday: completeProfilePrefill?.birthDate ?? profile.birthDate ?? '',
          gender: normalizeGender(completeProfilePrefill?.gender ?? profile.gender),
          avatarUrl: completeProfilePrefill?.avatarUrl ?? profile.avatarUrl ?? '',
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(error, t('completeProfile.loadError')),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [completeProfilePrefill, isAuthenticated, t]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const avatarSource = useMemo(
    () => avatarPreviewUrl || form.avatarUrl.trim() || toFallbackAvatarUrl(),
    [avatarPreviewUrl, form.avatarUrl],
  );

  const hasBaseFields =
    form.displayName.trim().length > 0
    && form.birthday.trim().length > 0
    && form.gender.trim().length > 0
    && (selectedAvatarFile !== null || form.avatarUrl.trim().length > 0);

  const hasGoogleFields =
    form.firstName.trim().length > 0
    && form.lastName.trim().length > 0
    && PHONE_PATTERN.test(form.phoneNumber.trim());

  const canSubmit = hasBaseFields && (!isGoogleCompletion || hasGoogleFields) && !isSubmitting;

  const setFormField = <K extends keyof CompleteProfileFormState>(key: K, value: CompleteProfileFormState[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openAvatarPicker = () => {
    if (isSubmitting) {
      return;
    }

    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!isImageFile(file)) {
      const message = t('completeProfile.invalidImageFile');
      setErrorMessage(message);
      showToast(message, 'error');
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phoneNumber = form.phoneNumber.trim();
    const displayName = form.displayName.trim();
    const birthday = form.birthday.trim();
    const gender = form.gender.trim().toUpperCase();
    const currentAvatarUrl = form.avatarUrl.trim();

    if (!displayName || !birthday || !gender || (!selectedAvatarFile && !currentAvatarUrl)) {
      const message = t(isGoogleCompletion ? 'completeProfile.requiredFieldsGoogle' : 'completeProfile.requiredFields');
      setErrorMessage(message);
      return;
    }

    if (isGoogleCompletion && (!firstName || !lastName || !phoneNumber)) {
      const message = t('completeProfile.requiredFieldsGoogle');
      setErrorMessage(message);
      return;
    }

    if (isGoogleCompletion && !PHONE_PATTERN.test(phoneNumber)) {
      const message = t('completeProfile.invalidPhone');
      setErrorMessage(message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const avatarUrl = selectedAvatarFile
        ? await cloudinaryService.uploadMedia(selectedAvatarFile)
        : currentAvatarUrl;

      await profileService.completeMyProfile({
        displayName,
        birthday,
        gender,
        avatarUrl,
        ...(isGoogleCompletion ? { firstName, lastName, phoneNumber } : {}),
      });

      await markProfileCompleted();
      showToast(t('completeProfile.submitSuccess'), 'success');
      navigate('/', { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        t('completeProfile.submitError'),
      );
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    t,
    isAuthenticated,
    isInitializing,
    requiresProfileCompletion,
    form,
    setFormField,
    avatarInputRef,
    isLoading,
    isSubmitting,
    isGoogleCompletion,
    avatarSource,
    errorMessage,
    canSubmit,
    toast,
    openAvatarPicker,
    handleAvatarFileChange,
    handleSubmit,
  };
};

export type UseCompleteProfilePageReturn = ReturnType<typeof useCompleteProfilePage>;

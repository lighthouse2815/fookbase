import { Camera, Save, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

import { CornerToast } from '@/components/CornerToast';
import { useAuth } from '@/contexts/AuthContext';
import { useCornerToast } from '@/hooks/useCornerToast';
import { cloudinaryService } from '@/services/cloudinaryService';
import { profileService } from '@/services/profileService';
import { getApiErrorMessage } from '@/utils/apiError';

interface CompleteProfileFormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  displayName: string;
  birthday: string;
  gender: string;
  avatarUrl: string;
}

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
const toFallbackAvatarUrl = (seed?: string) => `https://i.pravatar.cc/150?u=${seed ?? 'me'}`;
const isImageFile = (file: File) => file.type.trim().toLowerCase().startsWith('image/');
const maxBirthDate = new Date().toISOString().slice(0, 10);

export const CompleteProfilePage = () => {
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
    () => avatarPreviewUrl || form.avatarUrl.trim() || toFallbackAvatarUrl(form.displayName || 'profile'),
    [avatarPreviewUrl, form.avatarUrl, form.displayName],
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

  if (!isInitializing && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isInitializing && isAuthenticated && !requiresProfileCompletion) {
    return <Navigate to="/" replace />;
  }

  if (isInitializing || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/80"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <UserRound size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('completeProfile.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t(isGoogleCompletion ? 'completeProfile.subtitleGoogle' : 'completeProfile.subtitleLocal')}
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="mb-6 flex flex-col items-center">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleAvatarFileChange(event.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={openAvatarPicker}
            disabled={isSubmitting}
            className="group relative h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-900 dark:ring-slate-700"
          >
            <img
              src={avatarSource}
              alt={t('completeProfile.avatarAlt')}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
              <Camera size={24} className="text-white" />
            </span>
          </button>

          <button
            type="button"
            onClick={openAvatarPicker}
            disabled={isSubmitting}
            className="mt-3 text-xs font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {t('completeProfile.avatarButton')}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isGoogleCompletion ? (
            <>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('completeProfile.lastName')}
                <input
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      lastName: event.target.value,
                    }))}
                  disabled={isSubmitting}
                  placeholder={t('completeProfile.lastNamePlaceholder')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('completeProfile.firstName')}
                <input
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      firstName: event.target.value,
                    }))}
                  disabled={isSubmitting}
                  placeholder={t('completeProfile.firstNamePlaceholder')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('completeProfile.phoneNumber')}
                <input
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      phoneNumber: event.target.value,
                    }))}
                  disabled={isSubmitting}
                  placeholder={t('completeProfile.phoneNumberPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('completeProfile.email')}
                <input
                  value={form.email}
                  disabled
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                />
              </label>
            </>
          ) : null}

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('completeProfile.displayName')}
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  displayName: event.target.value,
                }))}
              disabled={isSubmitting}
              placeholder={t('completeProfile.displayNamePlaceholder')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('completeProfile.birthDate')}
            <input
              type="date"
              value={form.birthday}
              max={maxBirthDate}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  birthday: event.target.value,
                }))}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('completeProfile.gender')}
            <select
              value={form.gender}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  gender: event.target.value,
                }))}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
            >
              <option value="">{t('completeProfile.genderPlaceholder')}</option>
              <option value="MALE">{t('completeProfile.genderMale')}</option>
              <option value="FEMALE">{t('completeProfile.genderFemale')}</option>
              <option value="OTHER">{t('completeProfile.genderOther')}</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {isSubmitting ? t('completeProfile.saving') : t('completeProfile.saveAndContinue')}
          </button>
        </div>
      </form>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

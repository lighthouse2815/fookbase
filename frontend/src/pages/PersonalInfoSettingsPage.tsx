import { Camera, Save, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CornerToast } from '../components/CornerToast';
import { useCornerToast } from '../hooks/useCornerToast';
import { cloudinaryService } from '../services/cloudinaryService';
import type { MyProfileSettings, UpdateMyProfileRequest } from '@/interface/profile';
import { profileService } from '../services/profileService';
import { getApiErrorMessage } from '../utils/apiError';

interface FormState {
  displayName: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: string;
  avatarUrl: string;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  firstName: '',
  lastName: '',
  birthday: '',
  gender: '',
  avatarUrl: '',
};

const normalizeGender = (value?: string | null): string => value?.trim().toUpperCase() ?? '';
const toFallbackAvatarUrl = (seed?: string) => `https://i.pravatar.cc/150?u=${seed ?? 'me'}`;
const isImageFile = (file: File) => file.type.trim().toLowerCase().startsWith('image/');

export const PersonalInfoSettingsPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<MyProfileSettings | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
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
          gender: normalizeGender(data.gender),
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
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleFieldChange = (field: keyof FormState, value: string) => {
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
        gender: normalizeGender(refreshed.gender) || previous.gender,
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

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        {t('personalInfoSettings.loading')}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <UserRound size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('personalInfoSettings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('personalInfoSettings.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('personalInfoSettings.editSectionTitle')}
          </h2>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isEditing || isSaving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isEditing ? t('personalInfoSettings.editingButton') : t('personalInfoSettings.editButton')}
          </button>
        </div>

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
            disabled={!isEditing || isSaving}
            className="group relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-slate-200 disabled:cursor-not-allowed dark:border-slate-900 dark:ring-slate-700"
          >
            <img src={avatarSource} alt={t('personalInfoSettings.avatarAlt')} className="h-full w-full object-cover" />

            {isEditing ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                <Camera size={22} className="text-white" />
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={openAvatarPicker}
            disabled={!isEditing || isSaving}
            className="mt-3 text-xs font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {t('personalInfoSettings.changeAvatar')}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.username')}
            <input
              value={profile?.username ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            {isEditing ? (
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                {t('personalInfoSettings.securityEditHint')}
              </p>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.email')}
            <input
              value={profile?.email ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            {isEditing ? (
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                {t('personalInfoSettings.securityEditHint')}
              </p>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.phoneNumber')}
            <input
              value={profile?.phoneNumber ?? ''}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            {isEditing ? (
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                {t('personalInfoSettings.securityEditHint')}
              </p>
            ) : null}
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.displayName')}
            <input
              value={form.displayName}
              onChange={(event) => handleFieldChange('displayName', event.target.value)}
              disabled={!isEditing || isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
              placeholder={t('personalInfoSettings.displayNamePlaceholder')}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.firstName')}
            <input
              value={form.firstName}
              onChange={(event) => handleFieldChange('firstName', event.target.value)}
              disabled={!isEditing || isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
              placeholder={t('personalInfoSettings.firstNamePlaceholder')}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.lastName')}
            <input
              value={form.lastName}
              onChange={(event) => handleFieldChange('lastName', event.target.value)}
              disabled={!isEditing || isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
              placeholder={t('personalInfoSettings.lastNamePlaceholder')}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.birthDate')}
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => handleFieldChange('birthday', event.target.value)}
              disabled={!isEditing || isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('personalInfoSettings.gender')}
            <select
              value={form.gender}
              onChange={(event) => handleFieldChange('gender', event.target.value)}
              disabled={!isEditing || isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/70"
            >
              <option value="">{t('personalInfoSettings.genderPlaceholder')}</option>
              <option value="MALE">{t('personalInfoSettings.genderMale')}</option>
              <option value="FEMALE">{t('personalInfoSettings.genderFemale')}</option>
              <option value="OTHER">{t('personalInfoSettings.genderOther')}</option>
            </select>
          </label>
        </div>

        {isEditing ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? t('personalInfoSettings.savingButton') : t('personalInfoSettings.saveButton')}
          </button>
        </div>
      ) : null}
      </section>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

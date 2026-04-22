import { Camera, Save, UserRound } from 'lucide-react';

import { CornerToast } from '@/shared/ui/feedback/CornerToast';

import { usePersonalInfoSettings } from '@/features/settings/hooks/usePersonalInfoSettings';

export const PersonalInfoSettingsPage = () => {
  const {
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
  } = usePersonalInfoSettings();

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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



import { AtSign, CalendarDays, Eye, EyeOff, HeartHandshake, Phone, UserRound } from 'lucide-react';

import { useProfilePageInfoSettingsPage } from '@/features/settings/hooks/useProfilePageInfoSettingsPage';

interface VisibilitySwitchProps {
  checked: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onToggle: () => void;
}

const VisibilitySwitch = ({ checked, disabled, ariaLabel, onToggle }: VisibilitySwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
    } disabled:cursor-not-allowed disabled:opacity-60`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

export const ProfilePageInfoSettingsPage = () => {
  const {
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
  } = useProfilePageInfoSettingsPage();

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        {t('profilePageInfoSettings.loading')}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('profilePageInfoSettings.title')}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('profilePageInfoSettings.subtitle')}
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('profilePageInfoSettings.allFieldsTitle')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {allVisible
                  ? t('profilePageInfoSettings.allFieldsVisible')
                  : t('profilePageInfoSettings.allFieldsHidden')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {allVisible
                  ? t('profilePageInfoSettings.hideAllAction')
                  : t('profilePageInfoSettings.showAllAction')}
              </span>
              <VisibilitySwitch
                checked={allVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleAllAria')}
                onToggle={handleToggleAll}
              />
            </div>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <UserRound size={14} />
                {t('profilePageInfoSettings.fullName')}
              </dt>
              <VisibilitySwitch
                checked={visibility.fullNameVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.fullName') })}
                onToggle={() => handleToggleField('fullNameVisible')}
              />
            </div>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{fullNameValue}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Phone size={14} />
                {t('profilePageInfoSettings.phoneNumber')}
              </dt>
              <VisibilitySwitch
                checked={visibility.phoneVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.phoneNumber') })}
                onToggle={() => handleToggleField('phoneVisible')}
              />
            </div>
            <dd className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="truncate">{phoneValue}</span>
              <button
                type="button"
                onClick={toggleShowPhone}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={showPhone ? t('profilePageInfoSettings.hidePhone') : t('profilePageInfoSettings.showPhone')}
              >
                {showPhone ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPhone ? t('profilePageInfoSettings.hideValueAction') : t('profilePageInfoSettings.showValueAction')}
              </button>
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <AtSign size={14} />
                {t('profilePageInfoSettings.email')}
              </dt>
              <VisibilitySwitch
                checked={visibility.emailVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.email') })}
                onToggle={() => handleToggleField('emailVisible')}
              />
            </div>
            <dd className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="truncate">{emailValue}</span>
              <button
                type="button"
                onClick={toggleShowEmail}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={showEmail ? t('profilePageInfoSettings.hideEmail') : t('profilePageInfoSettings.showEmail')}
              >
                {showEmail ? <EyeOff size={13} /> : <Eye size={13} />}
                {showEmail ? t('profilePageInfoSettings.hideValueAction') : t('profilePageInfoSettings.showValueAction')}
              </button>
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} />
                {t('profilePageInfoSettings.dateOfBirth')}
              </dt>
              <VisibilitySwitch
                checked={visibility.dateOfBirthVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.dateOfBirth') })}
                onToggle={() => handleToggleField('dateOfBirthVisible')}
              />
            </div>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{dateOfBirthValue}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <UserRound size={14} />
                {t('profilePageInfoSettings.gender')}
              </dt>
              <VisibilitySwitch
                checked={visibility.genderVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.gender') })}
                onToggle={() => handleToggleField('genderVisible')}
              />
            </div>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{genderValue}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <HeartHandshake size={14} />
                {t('profilePageInfoSettings.friendsCount')}
              </dt>
              <VisibilitySwitch
                checked={visibility.friendCountVisible}
                disabled={isUpdatingVisibility}
                ariaLabel={t('profilePageInfoSettings.toggleFieldAria', { field: t('profilePageInfoSettings.friendsCount') })}
                onToggle={() => handleToggleField('friendCountVisible')}
              />
            </div>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{friendCountValue}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

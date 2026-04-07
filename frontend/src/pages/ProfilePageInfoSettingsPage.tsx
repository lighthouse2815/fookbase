import { AtSign, CalendarDays, ContactRound, HeartHandshake, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';
import { getApiErrorMessage } from '../utils/apiError';

const formatGender = (
  value: string | undefined,
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

const formatBirthDate = (value: string | undefined, emptyValue: string, locale: string): string => {
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

const toDisplayName = (profile: Profile | null, fallbackFullName: string, fallbackUser: string): string =>
  profile?.displayName?.trim() || fallbackFullName || fallbackUser;

const toNickname = (profile: Profile | null, emptyValue: string): string =>
  profile?.nickname?.trim() || emptyValue;

export const ProfilePageInfoSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const emptyValue = t('profilePageInfoSettings.emptyValue');
  const fallbackUser = t('profilePageInfoSettings.defaultUser');
  const currentLocale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await profileService.getProfileById(currentUser.id);
        if (isCancelled) {
          return;
        }

        setProfile(data);
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

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [currentUser.id]);

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

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <UserRound size={14} />
              {t('profilePageInfoSettings.displayName')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {toDisplayName(profile, currentUser.fullName, fallbackUser)}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ContactRound size={14} />
              {t('profilePageInfoSettings.nickname')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {toNickname(profile, emptyValue)}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <AtSign size={14} />
              {t('profilePageInfoSettings.profileUsername')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              @{toDisplayName(profile, currentUser.fullName, fallbackUser)}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Phone size={14} />
              {t('profilePageInfoSettings.phoneNumber')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile?.phoneNumber?.trim() || emptyValue}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <HeartHandshake size={14} />
              {t('profilePageInfoSettings.friendsCount')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {typeof profile?.friendsCount === 'number' ? profile.friendsCount : 0}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CalendarDays size={14} />
              {t('profilePageInfoSettings.birthDateGender')}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatBirthDate(profile?.birthDate, emptyValue, currentLocale)}
              {' - '}
              {formatGender(
                profile?.gender,
                emptyValue,
                t('profilePageInfoSettings.genderMale'),
                t('profilePageInfoSettings.genderFemale'),
                t('profilePageInfoSettings.genderOther'),
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

import { AtSign, CalendarDays, ContactRound, HeartHandshake, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { profileService } from '../services/profileService';
import type { Profile } from '../types/profile';
import { getApiErrorMessage } from '../utils/apiError';

const EMPTY_VALUE = 'Chua cap nhat';

const formatGender = (value?: string): string => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return EMPTY_VALUE;
  }

  if (normalized === 'MALE') {
    return 'Nam';
  }

  if (normalized === 'FEMALE') {
    return 'Nu';
  }

  if (normalized === 'OTHER') {
    return 'Khac';
  }

  return value?.trim() || EMPTY_VALUE;
};

const formatBirthDate = (value?: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return EMPTY_VALUE;
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return normalized;
  }

  return new Intl.DateTimeFormat('vi-VN').format(new Date(timestamp));
};

const toDisplayName = (profile: Profile | null, fallbackFullName: string): string =>
  profile?.displayName?.trim() || fallbackFullName || 'user';

const toNickname = (profile: Profile | null): string =>
  profile?.nickname?.trim() || EMPTY_VALUE;

export const ProfilePageInfoSettingsPage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        setErrorMessage(getApiErrorMessage(error, 'Khong the tai thong tin trang ca nhan.'));
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
        Dang tai thong tin trang ca nhan...
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
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Thong tin hien thi tren profile</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Day la nhung thong tin nguoi khac co the thay tren trang ca nhan cua ban.
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <UserRound size={14} />
              Ten hien thi
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {toDisplayName(profile, currentUser.fullName)}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ContactRound size={14} />
              Nickname
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{toNickname(profile)}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <AtSign size={14} />
              Username profile
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              @{toDisplayName(profile, currentUser.fullName)}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Phone size={14} />
              So dien thoai
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile?.phoneNumber?.trim() || EMPTY_VALUE}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <HeartHandshake size={14} />
              So ban be
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {typeof profile?.friendsCount === 'number' ? profile.friendsCount : 0}
            </dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
            <dt className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CalendarDays size={14} />
              Ngay sinh / Gioi tinh
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {formatBirthDate(profile?.birthDate)} - {formatGender(profile?.gender)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};


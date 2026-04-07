import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useParams } from 'react-router-dom';

import { CornerToast } from '../components/CornerToast';
import { PostCard } from '../components/PostCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { useCornerToast } from '../hooks/useCornerToast';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { postService } from '../services/postService';
import { profileService } from '../services/profileService';
import type { Post } from '../types/post';
import type { Profile } from '../types/profile';

const POST_COLUMN_CLASS = 'mx-auto w-full max-w-[980px]';

const DEFAULT_PROFILE = (user: MainLayoutOutletContext['currentUser']): Profile => ({
  id: user.id,
  username: user.username,
  displayName: user.fullName,
  avatarUrl: user.avatarUrl,
  bio: '',
  coverUrl: undefined,
  friendsCount: 0,
  postsCount: 0,
});

const DEFAULT_PUBLIC_USERNAME = 'user';
const DEFAULT_PUBLIC_DISPLAY_NAME = 'User';

const createFallbackProfile = (
  targetUserId: string,
  currentUser: MainLayoutOutletContext['currentUser'],
): Profile => {
  if (targetUserId === currentUser.id) {
    return DEFAULT_PROFILE(currentUser);
  }

  return {
    ...DEFAULT_PROFILE(currentUser),
    id: targetUserId,
    username: DEFAULT_PUBLIC_USERNAME,
    displayName: DEFAULT_PUBLIC_DISPLAY_NAME,
    avatarUrl: `https://i.pravatar.cc/150?u=${targetUserId}`,
  };
};

const PROFILE_POSTS_PAGE_SIZE = 100;
const formatGender = (
  value: string | undefined,
  emptyValue: string,
  maleLabel: string,
  femaleLabel: string,
  otherLabel: string,
): string => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return emptyValue;
  }

  if (normalized === 'MALE') {
    return maleLabel;
  }

  if (normalized === 'FEMALE') {
    return femaleLabel;
  }

  if (normalized === 'OTHER') {
    return otherLabel;
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

export const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = userId ?? currentUser.id;
  const isOwnProfile = targetUserId === currentUser.id;
  const [profile, setProfile] = useState<Profile>(() => createFallbackProfile(targetUserId, currentUser));
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const { toast, showToast } = useCornerToast();
  const emptyInfoValue = t('profile.emptyInfoValue');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
    setProfile((previous) => ({
      ...previous,
      postsCount: personalPosts.length,
    }));
  }, [personalPosts.length]);

  useEffect(() => {
    setProfile(createFallbackProfile(targetUserId, currentUser));

    const loadProfile = async () => {
      try {
        const data = await profileService.getProfileById(targetUserId);
        setProfile((previous) => ({
          ...previous,
          ...data,
          username: data.username ?? previous.username,
          displayName: data.displayName || previous.displayName,
          bio: data.bio ?? previous.bio,
          coverUrl: data.coverUrl ?? previous.coverUrl,
        }));
      } catch {
        if (targetUserId === currentUser.id) {
          setProfile((previous) => ({
            ...previous,
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl,
          }));
        }
      }
    };

    void loadProfile();
  }, [currentUser, targetUserId]);

  useEffect(() => {
    const loadPersonalPosts = async () => {
      try {
        const response = await postService.getPosts(1, PROFILE_POSTS_PAGE_SIZE);
        const items = response.items.filter((post) => post.author.id === targetUserId);
        setPersonalPosts(items);
      } catch {
        setPersonalPosts([]);
      }
    };

    void loadPersonalPosts();
  }, [targetUserId]);

  const handlePostDeleted = (postId: string) => {
    setPersonalPosts((previous) => previous.filter((post) => post.id !== postId));
  };

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('profile.personalInfo')}</h2>

            <dl className="mt-3 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('profile.displayName')}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {profile.displayName?.trim() || emptyInfoValue}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('profile.phoneNumber')}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {profile.phoneNumber?.trim() || emptyInfoValue}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('profile.gender')}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatGender(
                    profile.gender,
                    emptyInfoValue,
                    t('profile.genderMale'),
                    t('profile.genderFemale'),
                    t('profile.genderOther'),
                  )}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t('profile.birthDate')}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatBirthDate(profile.birthDate, emptyInfoValue, locale)}
                </dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className={`${POST_COLUMN_CLASS} space-y-4`}>
          {personalPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onActionToast={showToast}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </section>
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};


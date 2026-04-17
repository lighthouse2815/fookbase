import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { CornerToast } from '@/components/CornerToast';
import { PostCard } from '@/components/PostCard';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useCornerToast } from '@/hooks/useCornerToast';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { friendshipService } from '@/services/friendship/friendshipService';
import { postService } from '@/services/postService';
import { profileService } from '@/services/profileService';
import type { Post } from '@/interface/post';
import { getApiErrorMessage } from '@/utils/apiError';

const POST_COLUMN_CLASS = 'mx-auto w-full max-w-[980px]';

interface Profile {
  id: string;
  username?: string;
  displayName: string;
  fullName?: string;
  avatarUrl: string;
  bio?: string;
  coverUrl?: string;
  friendsCount: number;
  postsCount: number;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  fullNameVisible?: boolean;
  phoneVisible?: boolean;
  emailVisible?: boolean;
  dateOfBirthVisible?: boolean;
  genderVisible?: boolean;
  friendCountVisible?: boolean;
  nickname?: string;
  friendshipStatus?: string;
  userStatus?: string;
}


const DEFAULT_PROFILE = (user: MainLayoutOutletContext['currentUser']): Profile => ({
  id: user.id,
  username: user.username,
  displayName: user.fullName,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  bio: '',
  coverUrl: undefined,
  friendsCount: 0,
  postsCount: 0,
  fullNameVisible: true,
  phoneVisible: true,
  emailVisible: true,
  dateOfBirthVisible: true,
  genderVisible: true,
  friendCountVisible: true,
  
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
    fullName: '',
    avatarUrl: `https://i.pravatar.cc/150?u=${targetUserId}`,
  };
};

const PROFILE_POSTS_PAGE_SIZE = 100;

type FriendshipStatusCode = 'NONE' | 'PENDING' | 'INVITED' | 'ACCEPTED' | 'BLOCKED' | 'REJECTED' | 'REMOVED' | 'UNKNOWN';
type ProfilePrimaryActionType = 'EDIT' | 'ADD' | 'CANCEL' | 'ACCEPT' | 'FRIENDS' | 'BLOCKED' | 'NONE';

interface ProfilePrimaryActionMeta {
  type: ProfilePrimaryActionType;
  label: string;
  buttonClassName: string;
  disabled: boolean;
}

const normalizeFriendshipStatus = (value?: string): FriendshipStatusCode => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return 'NONE';
  }

  if (
    normalized === 'NONE'
    || normalized === 'PENDING'
    || normalized === 'INVITED'
    || normalized === 'ACCEPTED'
    || normalized === 'BLOCKED'
    || normalized === 'REJECTED'
    || normalized === 'REMOVED'
  ) {
    return normalized;
  }

  return 'UNKNOWN';
};

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
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = userId ?? currentUser.id;
  const isOwnProfile = targetUserId === currentUser.id;
  const [profile, setProfile] = useState<Profile>(() => createFallbackProfile(targetUserId, currentUser));
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const { toast, showToast } = useCornerToast();
  const [isPrimaryActionLoading, setIsPrimaryActionLoading] = useState(false);
  const [menuActionLoading, setMenuActionLoading] = useState<'unfriend' | 'block' | 'report' | null>(null);
  const emptyInfoValue = t('profile.emptyInfoValue');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const friendshipStatus = normalizeFriendshipStatus(profile.friendshipStatus);

  const primaryActionMeta = useMemo<ProfilePrimaryActionMeta>(() => {
    if (isOwnProfile) {
      return {
        type: 'EDIT',
        label: t('profile.editProfile'),
        buttonClassName: 'bg-brand-600 text-white hover:bg-brand-700',
        disabled: false,
      };
    }

    if (friendshipStatus === 'PENDING') {
      return {
        type: 'CANCEL',
        label: t('profile.cancelRequest'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: false,
      };
    }

    if (friendshipStatus === 'INVITED') {
      return {
        type: 'ACCEPT',
        label: t('profile.acceptRequest'),
        buttonClassName: 'bg-sky-600 text-white hover:bg-sky-700',
        disabled: false,
      };
    }

    if (friendshipStatus === 'ACCEPTED') {
      return {
        type: 'FRIENDS',
        label: t('profile.friendsButton'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    if (friendshipStatus === 'BLOCKED') {
      return {
        type: 'BLOCKED',
        label: t('profile.blockedButton'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    if (friendshipStatus === 'UNKNOWN') {
      return {
        type: 'NONE',
        label: t('profile.addFriend'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    return {
      type: 'ADD',
      label: t('profile.addFriend'),
      buttonClassName: 'bg-brand-600 text-white hover:bg-brand-700',
      disabled: false,
    };
  }, [friendshipStatus, isOwnProfile, t]);

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
          fullName: data.fullName ?? previous.fullName,
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
            fullName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl,
          }));
        }
      }
    };

    void loadProfile();
  }, [currentUser, targetUserId]);

  useEffect(() => {
    setIsPrimaryActionLoading(false);
    setMenuActionLoading(null);
  }, [targetUserId]);

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

  const updateFriendshipStatus = (nextStatus: FriendshipStatusCode) => {
    setProfile((previous) => ({
      ...previous,
      friendshipStatus: nextStatus,
    }));
  };

  const adjustFriendsCount = (delta: number) => {
    setProfile((previous) => ({
      ...previous,
      friendsCount: Math.max(0, previous.friendsCount + delta),
    }));
  };

  const handlePrimaryAction = async () => {
    if (isOwnProfile) {
      navigate('/settings?tab=profile-page-info');
      return;
    }

    if (isPrimaryActionLoading || primaryActionMeta.disabled) {
      return;
    }

    setIsPrimaryActionLoading(true);

    try {
      if (primaryActionMeta.type === 'ADD') {
        await friendshipService.sendFriendRequest(targetUserId);
        updateFriendshipStatus('PENDING');
        showToast(t('profile.friendRequestSentSuccess'), 'success');
      } else if (primaryActionMeta.type === 'CANCEL') {
        await friendshipService.cancelSentRequest(targetUserId);
        updateFriendshipStatus('NONE');
        showToast(t('profile.friendRequestCanceledSuccess'), 'success');
      } else if (primaryActionMeta.type === 'ACCEPT') {
        await friendshipService.acceptFriendRequest(targetUserId);
        updateFriendshipStatus('ACCEPTED');
        adjustFriendsCount(1);
        showToast(t('profile.friendRequestAcceptedSuccess'), 'success');
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, t('profile.friendActionError')), 'error');
    } finally {
      setIsPrimaryActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (menuActionLoading) {
      return;
    }

    if (normalizeFriendshipStatus(profile.friendshipStatus) !== 'ACCEPTED') {
      return;
    }

    setMenuActionLoading('unfriend');

    try {
      await friendshipService.unfriend(targetUserId);
      updateFriendshipStatus('NONE');
      adjustFriendsCount(-1);
      showToast(t('profile.unfriendSuccess'), 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, t('profile.friendActionError')), 'error');
    } finally {
      setMenuActionLoading(null);
    }
  };

  const handleBlockUser = async () => {
    if (menuActionLoading) {
      return;
    }

    setMenuActionLoading('block');

    const wasFriend = normalizeFriendshipStatus(profile.friendshipStatus) === 'ACCEPTED';

    try {
      await friendshipService.blockUser(targetUserId);
      updateFriendshipStatus('BLOCKED');
      if (wasFriend) {
        adjustFriendsCount(-1);
      }
      showToast(t('profile.blockUserSuccess'), 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, t('profile.blockUserError')), 'error');
    } finally {
      setMenuActionLoading(null);
    }
  };

  const handleReportUser = async () => {
    if (menuActionLoading) {
      return;
    }

    setMenuActionLoading('report');

    try {
      await friendshipService.reportUser(targetUserId, `User report from profile page for user ${targetUserId}.`);
      showToast(t('profile.reportUserSuccess'), 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, t('profile.reportUserError')), 'error');
    } finally {
      setMenuActionLoading(null);
    }
  };

  const infoItems = [
    {
      key: 'fullName',
      visible: profile.fullNameVisible ?? true,
      label: t('profile.fullName'),
      value: profile.fullName?.trim() || emptyInfoValue,
    },
    {
      key: 'phoneNumber',
      visible: profile.phoneVisible ?? true,
      label: t('profile.phoneNumber'),
      value: profile.phoneNumber?.trim() || emptyInfoValue,
    },
    {
      key: 'email',
      visible: profile.emailVisible ?? true,
      label: t('profile.email'),
      value: profile.email?.trim() || emptyInfoValue,
    },
    {
      key: 'gender',
      visible: profile.genderVisible ?? true,
      label: t('profile.gender'),
      value: formatGender(
        profile.gender,
        emptyInfoValue,
        t('profile.genderMale'),
        t('profile.genderFemale'),
        t('profile.genderOther'),
      ),
    },
    {
      key: 'birthDate',
      visible: profile.dateOfBirthVisible ?? true,
      label: t('profile.birthDate'),
      value: formatBirthDate(profile.birthDate, emptyInfoValue, locale),
    },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        actionLabel={primaryActionMeta.label}
        actionButtonClassName={primaryActionMeta.buttonClassName}
        onPrimaryAction={handlePrimaryAction}
        isPrimaryActionLoading={isPrimaryActionLoading}
        primaryActionDisabled={primaryActionMeta.disabled}
        onUnfriend={handleUnfriend}
        onBlock={handleBlockUser}
        onReport={handleReportUser}
        isUnfriendLoading={menuActionLoading === 'unfriend'}
        isBlockLoading={menuActionLoading === 'block'}
        isReportLoading={menuActionLoading === 'report'}
        isUnfriendDisabled={friendshipStatus !== 'ACCEPTED'}
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('profile.personalInfo')}</h2>

            <dl className="mt-3 space-y-3">
              {infoItems.map((item) => (
                <div key={item.key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</dd>
                </div>
              ))}
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


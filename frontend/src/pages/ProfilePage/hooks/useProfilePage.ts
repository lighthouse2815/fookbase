import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { useCornerToast } from '@/hooks/useCornerToast';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { friendshipService } from '@/services/friendship/friendshipService';
import { postService } from '@/services/postService';
import { profileService } from '@/services/profileService';
import type { Post } from '@/interface/post';
import { getApiErrorMessage } from '@/utils/apiError';

import type { Profile, UseProfilePageReturn } from '../interface';
import type { FriendshipStatusCode, ProfileMenuAction } from '../type';
import {
  createFallbackProfile,
  formatBirthDate,
  formatGender,
  normalizeFriendshipStatus,
  PROFILE_POST_COLUMN_CLASS,
  PROFILE_POSTS_PAGE_SIZE,
} from '../util';

export const useProfilePage = (): UseProfilePageReturn => {
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
  const [menuActionLoading, setMenuActionLoading] = useState<ProfileMenuAction | null>(null);
  const emptyInfoValue = t('profile.emptyInfoValue');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const friendshipStatus = normalizeFriendshipStatus(profile.friendshipStatus);

  const primaryActionMeta = useMemo(() => {
    if (isOwnProfile) {
      return {
        type: 'EDIT' as const,
        label: t('profile.editProfile'),
        buttonClassName: 'bg-brand-600 text-white hover:bg-brand-700',
        disabled: false,
      };
    }

    if (friendshipStatus === 'PENDING') {
      return {
        type: 'CANCEL' as const,
        label: t('profile.cancelRequest'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: false,
      };
    }

    if (friendshipStatus === 'INVITED') {
      return {
        type: 'ACCEPT' as const,
        label: t('profile.acceptRequest'),
        buttonClassName: 'bg-sky-600 text-white hover:bg-sky-700',
        disabled: false,
      };
    }

    if (friendshipStatus === 'ACCEPTED') {
      return {
        type: 'FRIENDS' as const,
        label: t('profile.friendsButton'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    if (friendshipStatus === 'BLOCKED') {
      return {
        type: 'BLOCKED' as const,
        label: t('profile.blockedButton'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    if (friendshipStatus === 'UNKNOWN') {
      return {
        type: 'NONE' as const,
        label: t('profile.addFriend'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
      };
    }

    return {
      type: 'ADD' as const,
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
    if (!isOwnProfile && friendshipStatus === 'BLOCKED') {
      setPersonalPosts([]);
      return;
    }

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
  }, [friendshipStatus, isOwnProfile, targetUserId]);

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
      setPersonalPosts([]);
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

  return {
    t,
    currentUser,
    isOwnProfile,
    profile,
    personalPosts,
    toast,
    showToast,
    isPrimaryActionLoading,
    menuActionLoading,
    primaryActionMeta,
    friendshipStatus,
    infoItems,
    handlePostDeleted,
    handlePrimaryAction,
    handleUnfriend,
    handleBlockUser,
    handleReportUser,
    postColumnClass: PROFILE_POST_COLUMN_CLASS,
  };
};

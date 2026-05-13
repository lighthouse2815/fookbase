import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import type { MainLayoutOutletContext } from '@/shared/types/layout';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import { postService } from '@/features/post/api/service/postService';
import { profileService } from '@/features/profile/api/service/profileService';
import type { CreatePostDraft, Post } from '@/features/post/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';
import { cloudinaryService } from '@/shared/services/cloudinary/cloudinaryService';

import type { Profile, UseProfilePageReturn } from '@/features/profile/types/hooks';
import type { FriendshipStatusCode, ProfileMenuAction } from '@/features/profile/types/pages';
import {
  createFallbackProfile,
  formatBirthDate,
  formatGender,
  normalizeFriendshipStatus,
  PROFILE_POST_COLUMN_CLASS,
  PROFILE_POSTS_PAGE_SIZE,
} from '@/features/profile/utils/page.util';

export const useProfilePage = (): UseProfilePageReturn => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = userId ?? currentUser.id;
  const isOwnProfile = targetUserId === currentUser.id;
  const [profile, setProfile] = useState<Profile>(() => createFallbackProfile(targetUserId, currentUser));
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const { toast, showToast } = useCornerToast();
  const [isPrimaryActionLoading, setIsPrimaryActionLoading] = useState(false);
  const [menuActionLoading, setMenuActionLoading] = useState<ProfileMenuAction | null>(null);
  const emptyInfoValue = t('profile.emptyInfoValue');
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const friendshipStatus = normalizeFriendshipStatus(profile.friendshipStatus);
  const normalizedUserStatus = profile.userStatus?.trim().toUpperCase();
  const isBannedProfile = !isOwnProfile && normalizedUserStatus === 'BANNED';

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
        type: 'SENT' as const,
        label: t('profile.sentRequestButton'),
        buttonClassName:
          'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
        disabled: true,
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
    setCreatePostError(null);
    setIsSubmittingPost(false);
  }, [targetUserId]);

  useEffect(() => {
    if (isBannedProfile || (!isOwnProfile && friendshipStatus === 'BLOCKED')) {
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
  }, [friendshipStatus, isBannedProfile, isOwnProfile, targetUserId]);

  const handleCreatePost = async (draft: CreatePostDraft) => {
    if (!isOwnProfile) {
      return false;
    }

    setIsSubmittingPost(true);
    setCreatePostError(null);

    try {
      let uploadedVideoUrl: string | undefined;
      let uploadedImageUrls: string[] = [];

      if (draft.videoFile) {
        uploadedVideoUrl = await cloudinaryService.uploadMedia(draft.videoFile);
      }

      if (draft.imageFiles && draft.imageFiles.length > 0) {
        uploadedImageUrls = await Promise.all(
          draft.imageFiles.map((file) => cloudinaryService.uploadMedia(file)),
        );
      }

      const mediaUrls = uploadedVideoUrl
        ? [uploadedVideoUrl]
        : uploadedImageUrls.length > 0
          ? uploadedImageUrls
          : undefined;

      const created = await postService.createPost({
        content: draft.content,
        imageUrls: mediaUrls,
        visibility: draft.visibility,
      });

      setPersonalPosts((previous) => [created, ...previous]);
      return true;
    } catch (error) {
      setCreatePostError(getApiErrorMessage(error, 'Unable to create post.'));
      return false;
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPersonalPosts((previous) => previous.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPersonalPosts((previous) =>
      previous.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
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

  const handleCancelSentRequest = async () => {
    if (isPrimaryActionLoading || menuActionLoading) {
      return;
    }

    if (normalizeFriendshipStatus(profile.friendshipStatus) !== 'PENDING') {
      return;
    }

    setIsPrimaryActionLoading(true);

    try {
      await friendshipService.cancelSentRequest(targetUserId);
      updateFriendshipStatus('NONE');
      showToast(t('profile.friendRequestCanceledSuccess'), 'success');
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
    isSubmittingPost,
    createPostError,
    toast,
    showToast,
    isPrimaryActionLoading,
    menuActionLoading,
    primaryActionMeta,
    friendshipStatus,
    infoItems,
    handleCreatePost,
    handlePostDeleted,
    handlePostUpdated,
    handlePrimaryAction,
    handleCancelSentRequest,
    handleUnfriend,
    handleBlockUser,
    handleReportUser,
    postColumnClass: PROFILE_POST_COLUMN_CLASS,
  };
};



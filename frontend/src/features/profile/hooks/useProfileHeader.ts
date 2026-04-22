import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeFriendshipStatus } from '@/features/friendship/utils/statusCode';

import type { ProfileHeaderAsyncCallback, ProfileHeaderProps } from '@/features/profile/types/components';
import { getVisibleFriendsCount, normalizeOptionalTrimmed, normalizeProfileDisplayName } from '@/features/profile/utils/component.util';

export function useProfileHeader({
  profile,
  isOwnProfile = false,
  actionLabel,
  actionButtonClassName,
  onPrimaryAction,
  onCancelRequest,
  isPrimaryActionLoading = false,
  primaryActionDisabled = false,
  onUnfriend,
  onBlock,
  onReport,
  isUnfriendLoading = false,
  isBlockLoading = false,
  isReportLoading = false,
  isUnfriendDisabled = false,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const normalizedDisplayName = normalizeProfileDisplayName(profile.displayName);
  const normalizedNickname = normalizeOptionalTrimmed(profile.nickname);
  const visibleFriendCount = getVisibleFriendsCount(profile);
  const normalizedStatus = normalizeFriendshipStatus(profile.friendshipStatus);
  const isFriend = normalizedStatus === 'ACCEPTED';
  const resolvedActionLabel =
    actionLabel ??
    (isOwnProfile ? t('profile.editProfile') : isFriend ? t('profile.friendsButton') : t('profile.addFriend'));
  const resolvedActionButtonClass =
    actionButtonClassName ??
    (isOwnProfile || !isFriend
      ? 'bg-brand-600 hover:bg-brand-700 text-white'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100');
  const isAnyMenuActionLoading = isUnfriendLoading || isBlockLoading || isReportLoading;
  const isPending = normalizedStatus === 'PENDING';
  const isInvited = normalizedStatus === 'INVITED';
  const shouldShowRelationshipAction =
    !isOwnProfile && normalizedStatus !== 'BLOCKED' && normalizedStatus !== 'UNKNOWN';
  const relationshipAction = isFriend ? onUnfriend : isPending ? onCancelRequest : onPrimaryAction;
  const relationshipActionLabel = isFriend
    ? t('profile.unfriendAction')
    : isPending
      ? t('profile.cancelRequest')
      : isInvited
        ? t('profile.acceptRequest')
        : t('profile.addFriend');
  const isRelationshipActionLoading = isFriend ? isUnfriendLoading : isPrimaryActionLoading;
  const isRelationshipActionDisabled =
    !shouldShowRelationshipAction ||
    !relationshipAction ||
    (isFriend
      ? isUnfriendDisabled || isAnyMenuActionLoading
      : isPending
        ? isPrimaryActionLoading || isAnyMenuActionLoading
        : primaryActionDisabled || isPrimaryActionLoading || isAnyMenuActionLoading);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!actionMenuRef.current || (target && actionMenuRef.current.contains(target))) {
        return;
      }

      setIsActionMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionMenuOpen]);

  const handleMenuAction = (action?: ProfileHeaderAsyncCallback) => {
    if (!action || isAnyMenuActionLoading) {
      return;
    }

    setIsActionMenuOpen(false);
    void action();
  };

  return {
    t,
    profile,
    isOwnProfile,
    onPrimaryAction,
    onCancelRequest,
    isPrimaryActionLoading,
    primaryActionDisabled,
    onUnfriend,
    onBlock,
    onReport,
    isBlockLoading,
    isReportLoading,
    normalizedDisplayName,
    normalizedNickname,
    visibleFriendCount,
    isFriend,
    resolvedActionLabel,
    resolvedActionButtonClass,
    isAnyMenuActionLoading,
    isPending,
    isInvited,
    shouldShowRelationshipAction,
    relationshipAction,
    relationshipActionLabel,
    isRelationshipActionLoading,
    isRelationshipActionDisabled,
    isActionMenuOpen,
    setIsActionMenuOpen,
    actionMenuRef,
    handleMenuAction,
  };
}

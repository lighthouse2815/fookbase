import type { Profile } from '@/interface/profile';

import type { ProfileHeaderAsyncCallback } from './type';

export interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  actionLabel?: string;
  actionButtonClassName?: string;
  onPrimaryAction?: ProfileHeaderAsyncCallback;
  isPrimaryActionLoading?: boolean;
  primaryActionDisabled?: boolean;
  onUnfriend?: ProfileHeaderAsyncCallback;
  onBlock?: ProfileHeaderAsyncCallback;
  onReport?: ProfileHeaderAsyncCallback;
  isUnfriendLoading?: boolean;
  isBlockLoading?: boolean;
  isReportLoading?: boolean;
  isUnfriendDisabled?: boolean;
}

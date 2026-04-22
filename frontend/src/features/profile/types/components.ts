import type { Profile } from '@/features/profile/types/contracts';

export type ProfileHeaderAsyncCallback = () => void | Promise<void>;

export interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  actionLabel?: string;
  actionButtonClassName?: string;
  onPrimaryAction?: ProfileHeaderAsyncCallback;
  onCancelRequest?: ProfileHeaderAsyncCallback;
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


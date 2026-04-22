import type { TFunction } from 'i18next';

import type { Post } from '@/features/post/types/contracts';
import type { Profile } from '@/features/profile/types/contracts';
import type { MainLayoutOutletContext } from '@/shared/types/layout';

import type { FriendshipStatusCode, ProfilePrimaryActionType, ProfileMenuAction } from '@/features/profile/types/pages';
export type { Profile } from '@/features/profile/types/contracts';

export interface ProfilePrimaryActionMeta {
  type: ProfilePrimaryActionType;
  label: string;
  buttonClassName: string;
  disabled: boolean;
}

export interface ProfileInfoItem {
  key: string;
  visible: boolean;
  label: string;
  value: string;
}

export interface UseProfilePageReturn {
  t: TFunction;
  currentUser: MainLayoutOutletContext['currentUser'];
  isOwnProfile: boolean;
  profile: Profile;
  personalPosts: Post[];
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error', durationMs?: number) => void;
  isPrimaryActionLoading: boolean;
  menuActionLoading: ProfileMenuAction | null;
  primaryActionMeta: ProfilePrimaryActionMeta;
  friendshipStatus: FriendshipStatusCode;
  infoItems: ProfileInfoItem[];
  handlePostDeleted: (postId: string) => void;
  handlePrimaryAction: () => Promise<void>;
  handleCancelSentRequest: () => Promise<void>;
  handleUnfriend: () => Promise<void>;
  handleBlockUser: () => Promise<void>;
  handleReportUser: () => Promise<void>;
  postColumnClass: string;
}



import type { TFunction } from 'i18next';

import type { Post } from '@/interface/post';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';

import type { FriendshipStatusCode, ProfilePrimaryActionType, ProfileMenuAction } from './type';

export interface Profile {
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
  handleUnfriend: () => Promise<void>;
  handleBlockUser: () => Promise<void>;
  handleReportUser: () => Promise<void>;
  postColumnClass: string;
}

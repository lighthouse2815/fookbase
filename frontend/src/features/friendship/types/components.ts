import type { LucideIcon } from 'lucide-react';

import type { FriendRequest, FriendSuggestion, FriendUser } from '@/features/friendship/types/contracts';
import type { ProfileRelation } from '@/features/friendship/types/pages';

export type UserCardVariant = 'grid' | 'list';

export type FriendRequestCardMode = 'received' | 'sent';

export type PreviewTab = 'posts' | 'photos' | 'about';

export type ProfilePreviewUser = FriendSuggestion | FriendRequest | FriendUser;

export interface UserCardProps {
  user: FriendSuggestion | FriendUser;
  variant?: UserCardVariant;
  selected?: boolean;
  statusText?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onSelect?: () => void;
}

export interface FriendRequestCardProps {
  request: FriendRequest;
  mode: FriendRequestCardMode;
  selected?: boolean;
  onSelect?: () => void;
  onConfirm?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export interface ProfilePreviewProps {
  user: ProfilePreviewUser | null;
  relation: ProfileRelation;
  onClose?: () => void;
  onAddFriend?: () => void;
  onMessage?: () => void;
  onConfirmRequest?: () => void;
  onDeleteRequest?: () => void;
  onCancelRequest?: () => void;
  onUnfriend?: () => void;
}

export interface ProfilePreviewTabItem {
  id: PreviewTab;
  label: string;
  icon: LucideIcon;
}

export interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  count?: number;
  onClick: () => void;
}

export interface FriendsSkeletonBoxProps {
  className: string;
}

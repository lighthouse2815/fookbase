import type {
  CommentReactionFriendshipStatus,
  CreatePostDraft,
  Post,
  PostReactionType,
} from '@/interface/post';
import type { User } from '@/interface/user';

import type { ReactionFilterTab } from './type';

export interface ReactionMeta {
  type: PostReactionType;
  label: string;
  icon: string;
}

export interface PostCardProps {
  post: Post;
  currentUser: User;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
  onPostDeleted?: (postId: string) => void;
}

export interface CreatePostBoxProps {
  currentUser: User;
  isSubmitting?: boolean;
  onCreatePost: (draft: CreatePostDraft) => Promise<boolean> | boolean;
}

export interface PostReactionViewerModalProps {
  postId: string;
  isOpen: boolean;
  initialFilter: ReactionFilterTab;
  currentUserId: string;
  onClose: () => void;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export interface ReactionFriendState {
  status: CommentReactionFriendshipStatus;
  requestId?: string;
}

export interface FriendActionButtonMeta {
  label: string;
  disabled: boolean;
  className: string;
}

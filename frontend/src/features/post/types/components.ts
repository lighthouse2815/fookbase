import type {
  CommentReactionFriendshipStatus,
  CreatePostDraft,
  Post,
  PostReactionType,
  PostReactionUser,
} from '@/features/post/types/contracts';
import type { User } from '@/features/user/types/contracts';

export type ReactionFilterTab = 'ALL' | PostReactionType;

export type CreatePostMediaKind = 'image' | 'video' | null;

export interface ReactionMeta {
  type: PostReactionType;
  label: string;
  icon: string;
}

export interface PostCardProps {
  post: Post;
  currentUser: User;
  enableMediaViewer?: boolean;
  showEngagementActions?: boolean;
  showPostMenu?: boolean;
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

export interface ReactionViewerTab {
  type: ReactionFilterTab;
  label: string;
  count: number;
}

export type PostReactionMetaByType = Record<PostReactionType, ReactionMeta>;

export type PostReactionUsers = PostReactionUser[];


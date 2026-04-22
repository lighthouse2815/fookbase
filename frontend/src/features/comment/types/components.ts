import type { Comment, CommentReactionFriendshipStatus, CommentReactionType } from '@/features/comment/types/contracts';
import type { User } from '@/features/user/types/contracts';

export type ReactionFilterTab = 'ALL' | CommentReactionType;

export type ReactionFriendAction = 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'ADD_FRIEND';

export interface ReactionMeta {
  type: CommentReactionType;
  label: string;
  icon: string;
}

export interface ReactionOptionBase {
  type: CommentReactionType;
  icon: string;
}

export interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  initialComments: Comment[];
  initialCommentCount?: number;
  currentUser: User;
  onCommentCountChange?: (count: number) => void;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export interface ReactionFriendState {
  status: CommentReactionFriendshipStatus;
  requestId?: string;
}

export interface VisibleCommentRow {
  comment: Comment;
  actualLevel: number;
  visualLevel: number;
}

export interface ReactionFriendActionMeta {
  action: ReactionFriendAction;
  label: string;
  disabled: boolean;
  className: string;
}

export interface ReactionViewerTabItem {
  type: ReactionFilterTab;
  label: string;
  count: number;
}


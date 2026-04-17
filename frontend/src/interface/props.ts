import type { CreatePostDraft } from "./post";
import type { User } from "./user";
import type { Comment } from "./post";
export interface CornerToastProps {
    message: string | null;
    type?: 'success' | 'error';
  }

  export interface CreatePostBoxProps {
    currentUser: User;
    isSubmitting?: boolean;
    onCreatePost: (draft: CreatePostDraft) => Promise<boolean> | boolean;
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
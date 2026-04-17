import type { CreatePostDraft } from "./post";
import type { User } from "./user";
export interface CornerToastProps {
    message: string | null;
    type?: 'success' | 'error';
  }

  export interface CreatePostBoxProps {
    currentUser: User;
    isSubmitting?: boolean;
    onCreatePost: (draft: CreatePostDraft) => Promise<boolean> | boolean;
  }
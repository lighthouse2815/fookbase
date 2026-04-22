import type { StoryAuthor, StoryItem, StoryReactionType } from '@/features/story/types/contracts';
import type { User } from '@/features/user/types/contracts';

import type { ActionToastType } from '@/features/story/types/common';

export interface StoryViewerProps {
  author: StoryAuthor;
  stories: StoryItem[];
  initialIndex?: number;
  currentUserId?: string;
  onClose: () => void;
  onMarkViewed: (storyId: string) => Promise<void>;
  onDeleteStory?: (storyId: string) => Promise<void>;
  onReactionChange?: (storyId: string, reactionType: StoryReactionType | null) => void;
  onActionToast?: (message: string, type?: ActionToastType) => void;
}

export interface StoryListProps {
  currentUser: User;
  onActionToast?: (message: string, type?: ActionToastType) => void;
}

export interface StoryComposerModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  content: string;
  errorMessage: string | null;
  onClose: () => void;
  onFileSelected: (file: File | null) => void;
  onContentChanged: (value: string) => void;
  onSubmit: () => void;
}

export interface ReactionMeta {
  type: StoryReactionType;
  labelKey: string;
  icon: string;
}

export interface FloatingReactionIcon {
  id: number;
  icon: string;
  left: number;
}


import type { ReactNode } from 'react';

import type { StoryGroup, StoryItem, StoryReactionType } from '@/features/story/types/contracts';

export interface StoryProviderProps {
  children: ReactNode;
}

export interface StoryContextValue {
  stories: StoryItem[];
  storyGroups: StoryGroup[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  errorMessage: string | null;
  refreshStories: () => Promise<void>;
  loadMoreStories: () => Promise<void>;
  createStoryFromFile: (file: File, content?: string) => Promise<StoryItem>;
  markStoryViewed: (storyId: string) => Promise<void>;
  getStoriesByUser: (userId: string) => Promise<StoryItem[]>;
  removeStory: (storyId: string) => Promise<void>;
  setStoryReactionState: (storyId: string, reactionType: StoryReactionType | null) => void;
}
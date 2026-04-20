/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { cloudinaryService } from '@/services/cloudinaryService';
import { storyService } from '@/services/storyService';
import type { StoryAuthor, StoryGroup, StoryItem, StoryMediaType, StoryReactionType } from '@/interface/story';

interface StoryContextValue {
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

const StoryContext = createContext<StoryContextValue | undefined>(undefined);

const STORY_PAGE_SIZE = 20;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const sortStoriesDescending = (items: StoryItem[]): StoryItem[] => {
  return [...items].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();
    return secondTime - firstTime;
  });
};

const mergeStories = (current: StoryItem[], incoming: StoryItem[]): StoryItem[] => {
  const merged = new Map<string, StoryItem>();
  current.forEach((story) => merged.set(story.id, story));
  incoming.forEach((story) => merged.set(story.id, story));
  return sortStoriesDescending(Array.from(merged.values()));
};

const normalizeMediaType = (file: File): StoryMediaType => {
  if (IMAGE_TYPES.has(file.type)) {
    return 'IMAGE';
  }

  if (VIDEO_TYPES.has(file.type)) {
    return 'VIDEO';
  }

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
    return 'IMAGE';
  }

  if (['.mp4', '.webm', '.mov'].includes(extension)) {
    return 'VIDEO';
  }

  throw new Error('Story chi ho tro file anh hoac video.');
};

const validateFileSize = (file: File, mediaType: StoryMediaType) => {
  const maxBytes = mediaType === 'IMAGE' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > maxBytes) {
    const maxSizeMb = Math.floor(maxBytes / (1024 * 1024));
    throw new Error(`File vuot qua gioi han ${maxSizeMb}MB cho ${mediaType.toLowerCase()}.`);
  }
};

const buildFallbackAuthor = (story: StoryItem): StoryAuthor => ({
  id: story.userId,
  username: story.author?.username ?? 'user',
  displayName: story.author?.displayName ?? story.author?.username ?? 'user',
  avatarUrl: story.author?.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
});

const groupStories = (stories: StoryItem[], currentUserId?: string): StoryGroup[] => {
  const byUser = new Map<string, StoryItem[]>();

  stories.forEach((story) => {
    const userStories = byUser.get(story.userId) ?? [];
    userStories.push(story);
    byUser.set(story.userId, userStories);
  });

  const groups = Array.from(byUser.entries()).map(([userId, userStories]) => {
    const sortedUserStories = [...userStories].sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return firstTime - secondTime;
    });
    const latestStory = sortedUserStories[sortedUserStories.length - 1];

    return {
      userId,
      author: buildFallbackAuthor(latestStory),
      stories: sortedUserStories,
      hasUnviewed: sortedUserStories.some((story) => !story.isViewedByCurrentUser),
      latestCreatedAt: latestStory.createdAt,
      isMine: currentUserId === userId,
    };
  });

  return groups.sort((first, second) => {
    if (first.isMine && !second.isMine) {
      return -1;
    }

    if (!first.isMine && second.isMine) {
      return 1;
    }

    const firstTime = new Date(first.latestCreatedAt).getTime();
    const secondTime = new Date(second.latestCreatedAt).getTime();
    return secondTime - firstTime;
  });
};

export const StoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadStoriesPage = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setErrorMessage(null);
    if (replace) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await storyService.getFeed(targetPage, STORY_PAGE_SIZE);
      setStories((existing) => (replace ? sortStoriesDescending(result.items) : mergeStories(existing, result.items)));
      setPage(targetPage);
      setHasMore(result.hasMore);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai stories.');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setStories([]);
      setPage(1);
      setHasMore(true);
      setErrorMessage(null);
      return;
    }

    void loadStoriesPage(1, true);
  }, [isAuthenticated, loadStoriesPage]);

  const refreshStories = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    await loadStoriesPage(1, true);
  }, [isAuthenticated, loadStoriesPage]);

  const loadMoreStories = useCallback(async () => {
    if (!isAuthenticated || !hasMore || loadingRef.current) {
      return;
    }

    await loadStoriesPage(page + 1, false);
  }, [hasMore, isAuthenticated, loadStoriesPage, page]);

  const createStoryFromFile = useCallback(
    async (file: File, content?: string) => {
      if (!isAuthenticated) {
        throw new Error('Ban can dang nhap de dang story.');
      }

      const mediaType = normalizeMediaType(file);
      validateFileSize(file, mediaType);

      const uploadedMediaUrl = await cloudinaryService.uploadMedia(file);
      const created = await storyService.createStory({
        mediaUrl: uploadedMediaUrl,
        mediaType,
        content: content?.trim() ? content.trim() : undefined,
      });

      setStories((existing) => mergeStories([created], existing));
      return created;
    },
    [isAuthenticated],
  );

  const markStoryViewed = useCallback(async (storyId: string) => {
    setStories((existing) =>
      existing.map((story) =>
        story.id === storyId
          ? {
              ...story,
              isViewedByCurrentUser: true,
            }
          : story,
      ),
    );

    try {
      await storyService.markAsViewed(storyId);
    } catch {
      // Keep optimistic viewed state to avoid UX flicker.
    }
  }, []);

  const getStoriesByUser = useCallback(
    async (userId: string) => {
      const existing = stories
        .filter((story) => story.userId === userId)
        .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());

      if (existing.length > 0) {
        return existing;
      }

      const result = await storyService.getByUser(userId, 1, 50);
      return [...result.items].sort(
        (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
      );
    },
    [stories],
  );

  const removeStory = useCallback(async (storyId: string) => {
    await storyService.deleteStory(storyId);
    setStories((existing) => existing.filter((story) => story.id !== storyId));
  }, []);

  const setStoryReactionState = useCallback((storyId: string, reactionType: StoryReactionType | null) => {
    setStories((existing) =>
      existing.map((story) =>
        story.id === storyId
          ? {
              ...story,
              currentUserReactionType: reactionType,
            }
          : story,
      ),
    );
  }, []);

  const storyGroups = useMemo(() => groupStories(stories, user?.id), [stories, user?.id]);

  const value = useMemo(
    () => ({
      stories,
      storyGroups,
      isLoading,
      isLoadingMore,
      hasMore,
      errorMessage,
      refreshStories,
      loadMoreStories,
      createStoryFromFile,
      markStoryViewed,
      getStoriesByUser,
      removeStory,
      setStoryReactionState,
    }),
    [
      stories,
      storyGroups,
      isLoading,
      isLoadingMore,
      hasMore,
      errorMessage,
      refreshStories,
      loadMoreStories,
      createStoryFromFile,
      markStoryViewed,
      getStoriesByUser,
      removeStory,
      setStoryReactionState,
    ],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};

export const useStories = (): StoryContextValue => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStories must be used within StoryProvider.');
  }

  return context;
};

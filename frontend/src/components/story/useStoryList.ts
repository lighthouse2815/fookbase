import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useStories } from '@/contexts/StoryContext';
import type { StoryGroup, StoryItem } from '@/interface/story';

import type { StoryListProps } from './interface';

export function useStoryList({ currentUser, onActionToast }: StoryListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { storyGroups, isLoading, isLoadingMore, hasMore, errorMessage, loadMoreStories, createStoryFromFile, markStoryViewed, getStoriesByUser, removeStory, setStoryReactionState } =
    useStories();

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);

  const [viewerGroup, setViewerGroup] = useState<StoryGroup | null>(null);
  const [viewerStories, setViewerStories] = useState<StoryItem[]>([]);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
  const [isViewerLoading, setIsViewerLoading] = useState(false);

  const myGroup = useMemo(() => storyGroups.find((group) => group.userId === currentUser.id), [currentUser.id, storyGroups]);
  const visibleGroups = useMemo(() => {
    if (myGroup) {
      return storyGroups;
    }

    return [
      {
        userId: currentUser.id,
        author: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.fullName,
          avatarUrl: currentUser.avatarUrl,
        },
        stories: [],
        hasUnviewed: false,
        latestCreatedAt: new Date(0).toISOString(),
        isMine: true,
      },
      ...storyGroups,
    ];
  }, [currentUser.avatarUrl, currentUser.fullName, currentUser.id, currentUser.username, myGroup, storyGroups]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openComposer = () => {
    setComposerError(null);
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setSelectedFile(null);
    setContent('');
    setComposerError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
    setComposerError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateStory = async () => {
    if (!selectedFile || isCreatingStory) {
      return;
    }

    setIsCreatingStory(true);
    setComposerError(null);

    try {
      await createStoryFromFile(selectedFile, content);
      closeComposer();
      onActionToast?.(t('story.list.createSuccess'), 'success');
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : t('story.list.createError'));
    } finally {
      setIsCreatingStory(false);
    }
  };

  const openStoryViewer = async (group: StoryGroup, initialStoryIndex = 0) => {
    if (group.stories.length === 0) {
      if (group.isMine) {
        openComposer();
      }
      return;
    }

    setIsViewerLoading(true);
    try {
      const stories = await getStoriesByUser(group.userId);
      if (stories.length === 0) {
        return;
      }

      setViewerGroup(group);
      setViewerStories(stories);
      setViewerStoryIndex(Math.max(0, Math.min(initialStoryIndex, stories.length - 1)));
    } catch (error) {
      onActionToast?.(error instanceof Error ? error.message : t('story.viewer.openError'), 'error');
    } finally {
      setIsViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setViewerGroup(null);
    setViewerStories([]);
    setViewerStoryIndex(0);
  };

  const handleStoryReactionChanged = (storyId: string, reactionType: StoryItem['currentUserReactionType']) => {
    setStoryReactionState(storyId, reactionType ?? null);
    setViewerStories((existing) =>
      existing.map((story) =>
        story.id === storyId
          ? {
              ...story,
              currentUserReactionType: reactionType ?? null,
            }
          : story,
      ),
    );
  };

  return {
    t,
    navigate,
    scrollRef,
    storyGroups,
    isLoading,
    isLoadingMore,
    hasMore,
    errorMessage,
    loadMoreStories,
    markStoryViewed,
    removeStory,
    visibleGroups,
    isComposerOpen,
    closeComposer,
    openComposer,
    isCreatingStory,
    selectedFile,
    previewUrl,
    content,
    setContent,
    composerError,
    handleFileSelected,
    handleCreateStory,
    viewerGroup,
    viewerStories,
    viewerStoryIndex,
    isViewerLoading,
    openStoryViewer,
    closeViewer,
    handleStoryReactionChanged,
  };
}

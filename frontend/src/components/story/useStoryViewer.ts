import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { storyService } from '@/services/storyService';
import { storyReportService } from '@/services/story/storyReportService';
import type { StoryReactionType } from '@/interface/story';

import type { FloatingReactionIcon, StoryViewerProps } from './interface';
import { getReactionMeta, IMAGE_DURATION_MS, REACTION_OPTIONS, VIDEO_FALLBACK_DURATION_MS } from './util';

export function useStoryViewer({
  author,
  stories,
  initialIndex = 0,
  currentUserId,
  onClose,
  onMarkViewed,
  onDeleteStory,
  onReactionChange,
  onActionToast,
}: StoryViewerProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactionSubmitting, setIsReactionSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState<string | null>(null);
  const [isReportingStory, setIsReportingStory] = useState(false);
  const [reactionByStoryId, setReactionByStoryId] = useState<Record<string, StoryReactionType | null>>({});
  const [floatingReactionIcons, setFloatingReactionIcons] = useState<FloatingReactionIcon[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const reactionAnimationCounterRef = useRef(0);
  const reactionAnimationTimeoutIdsRef = useRef<number[]>([]);

  const activeStory = stories[currentIndex];
  const isOwnerStory = Boolean(currentUserId && activeStory?.userId === currentUserId);
  const totalStories = stories.length;
  const activeReactionType = activeStory ? reactionByStoryId[activeStory.id] ?? null : null;
  const isVideoStory = activeStory?.mediaType === 'VIDEO';

  const activeDurationMs = useMemo(() => {
    if (!activeStory) {
      return IMAGE_DURATION_MS;
    }

    if (activeStory.mediaType === 'VIDEO') {
      return videoDurationMs ?? VIDEO_FALLBACK_DURATION_MS;
    }

    return IMAGE_DURATION_MS;
  }, [activeStory, videoDurationMs]);

  useEffect(() => {
    if (!activeStory || activeStory.isViewedByCurrentUser) {
      return;
    }

    void onMarkViewed(activeStory.id);
  }, [activeStory, onMarkViewed]);

  useEffect(() => {
    setReactionByStoryId(() => {
      const initial: Record<string, StoryReactionType | null> = {};
      stories.forEach((story) => {
        initial[story.id] = story.currentUserReactionType ?? null;
      });
      return initial;
    });
  }, [stories]);

  useEffect(() => {
    setProgress(0);
    setVideoDurationMs(null);
  }, [activeStory?.id]);

  useEffect(() => {
    if (!activeStory) {
      return;
    }

    if (isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        const next = current + 100 / activeDurationMs;
        if (next >= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }

          setCurrentIndex((prev) => {
            if (prev >= totalStories - 1) {
              onClose();
              return prev;
            }

            return prev + 1;
          });

          return 0;
        }

        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeDurationMs, activeStory, isPaused, onClose, totalStories]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = isMuted;

    if (isPaused) {
      void video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [activeStory?.id, isMuted, isPaused]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activeStory?.id]);

  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      const targetNode = event.target as Node | null;
      if (targetNode && !menuRef.current.contains(targetNode)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    return () => {
      reactionAnimationTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      reactionAnimationTimeoutIdsRef.current = [];
    };
  }, []);

  const spawnReactionAnimation = (reactionType: StoryReactionType) => {
    const icon = getReactionMeta(reactionType).icon;
    const id = reactionAnimationCounterRef.current++;
    const left = 38 + Math.random() * 24;

    setFloatingReactionIcons((previous) => [...previous, { id, icon, left }]);

    const timeoutId = window.setTimeout(() => {
      setFloatingReactionIcons((previous) => previous.filter((item) => item.id !== id));
      reactionAnimationTimeoutIdsRef.current = reactionAnimationTimeoutIdsRef.current.filter((item) => item !== timeoutId);
    }, 720);

    reactionAnimationTimeoutIdsRef.current.push(timeoutId);
  };

  const setStoryReaction = async (reactionType: StoryReactionType) => {
    if (!activeStory || isReactionSubmitting) {
      return;
    }

    const storyId = activeStory.id;
    const previousReactionType = reactionByStoryId[storyId] ?? null;
    const isRemovingReaction = previousReactionType === reactionType;
    const nextReactionType = isRemovingReaction ? null : reactionType;

    if (nextReactionType) {
      spawnReactionAnimation(nextReactionType);
    }

    setReactionByStoryId((previous) => ({
      ...previous,
      [storyId]: nextReactionType,
    }));
    onReactionChange?.(storyId, nextReactionType);
    setIsReactionSubmitting(true);

    try {
      if (isRemovingReaction) {
        await storyService.removeReaction(storyId);
        return;
      }

      const persistedReactionType = await storyService.setReaction(storyId, reactionType);
      const normalizedReactionType = persistedReactionType ?? reactionType;
      setReactionByStoryId((previous) => ({
        ...previous,
        [storyId]: normalizedReactionType,
      }));
      if (normalizedReactionType !== nextReactionType) {
        onReactionChange?.(storyId, normalizedReactionType);
      }

      if (!isOwnerStory) {
        const icon = getReactionMeta(normalizedReactionType).icon;
        onActionToast?.(`${icon} ${t('story.viewer.reactionSentToast', { name: author.displayName })}`, 'success');
      }
    } catch {
      setReactionByStoryId((previous) => ({
        ...previous,
        [storyId]: previousReactionType,
      }));
      onReactionChange?.(storyId, previousReactionType);
      onActionToast?.(t('story.viewer.reactionError'), 'error');
    } finally {
      setIsReactionSubmitting(false);
    }
  };

  const handleConfirmReportStory = async () => {
    const normalizedReason = reportReason.trim();
    if (normalizedReason.length < 3) {
      setReportReasonError(t('story.viewer.reportReasonMinLength'));
      return;
    }

    if (!activeStory || isReportingStory) {
      return;
    }

    try {
      setIsReportingStory(true);
      await storyReportService.create(activeStory.id, normalizedReason);
      setIsReportDialogOpen(false);
      setIsMenuOpen(false);
      setReportReason('');
      setReportReasonError(null);
      onActionToast?.(t('story.viewer.reportSent'), 'success');
    } catch {
      onActionToast?.(t('story.viewer.reportError', 'Unable to send story report.'), 'error');
    } finally {
      setIsReportingStory(false);
    }
  };

  const goPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    if (currentIndex >= totalStories - 1) {
      onClose();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleDeleteCurrentStory = async () => {
    if (!onDeleteStory || !activeStory || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteStory(activeStory.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    t,
    author,
    stories,
    activeStory,
    currentIndex,
    progress,
    isPaused,
    setIsPaused,
    isMuted,
    setIsMuted,
    videoRef,
    menuRef,
    isOwnerStory,
    totalStories,
    activeReactionType,
    isVideoStory,
    isDeleting,
    isReactionSubmitting,
    isMenuOpen,
    setIsMenuOpen,
    isReportDialogOpen,
    setIsReportDialogOpen,
    reportReason,
    setReportReason,
    reportReasonError,
    setReportReasonError,
    isReportingStory,
    floatingReactionIcons,
    setVideoDurationMs,
    onClose,
    onDeleteStory,
    goPrevious,
    goNext,
    setStoryReaction,
    handleConfirmReportStory,
    handleDeleteCurrentStory,
    getReactionMeta,
    reactionOptions: REACTION_OPTIONS,
  };
}

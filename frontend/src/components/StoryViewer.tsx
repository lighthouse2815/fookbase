import { Pause, Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { StoryAuthor, StoryItem } from '../types/story';
import { formatRelativeTime } from '../utils/date';

interface StoryViewerProps {
  author: StoryAuthor;
  stories: StoryItem[];
  initialIndex?: number;
  currentUserId?: string;
  onClose: () => void;
  onMarkViewed: (storyId: string) => Promise<void>;
  onDeleteStory?: (storyId: string) => Promise<void>;
}

const IMAGE_DURATION_MS = 5000;
const VIDEO_FALLBACK_DURATION_MS = 9000;

export const StoryViewer = ({
  author,
  stories,
  initialIndex = 0,
  currentUserId,
  onClose,
  onMarkViewed,
  onDeleteStory,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStory = stories[currentIndex];
  const isOwnerStory = Boolean(currentUserId && activeStory?.userId === currentUserId);
  const totalStories = stories.length;

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

    if (isPaused) {
      void video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [activeStory?.id, isPaused]);

  if (!activeStory) {
    return null;
  }

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-2 sm:p-4">
      <div
        className="relative h-full w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-950 shadow-2xl"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="absolute inset-x-3 top-3 z-20 flex items-center gap-1">
          {stories.map((story, index) => {
            const segmentProgress = index < currentIndex ? 1 : index > currentIndex ? 0 : progress;
            return (
              <div key={story.id} className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full bg-white transition-[width] duration-100"
                  style={{ width: `${Math.max(0, Math.min(1, segmentProgress)) * 100}%` }}
                />
              </div>
            );
          })}
        </div>

        <header className="absolute inset-x-3 top-6 z-20 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={author.avatarUrl} alt={author.displayName} className="h-9 w-9 rounded-full border border-white/50" />
            <div>
              <p className="text-sm font-semibold text-white">{author.displayName}</p>
              <p className="text-xs text-white/80">{formatRelativeTime(activeStory.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              aria-label={isPaused ? 'Phat tiep story' : 'Tam dung story'}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              aria-label="Dong story viewer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <button
          type="button"
          onClick={goPrevious}
          className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-pointer"
          aria-label="Story truoc do"
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-pointer"
          aria-label="Story tiep theo"
        />

        {activeStory.mediaType === 'VIDEO' ? (
          <video
            ref={videoRef}
            src={activeStory.mediaUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
            onLoadedMetadata={(event) => {
              const durationSeconds = event.currentTarget.duration;
              if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
                setVideoDurationMs(Math.max(durationSeconds * 1000, 3000));
              }
            }}
          />
        ) : (
          <img src={activeStory.mediaUrl} alt={author.displayName} className="h-full w-full object-cover" />
        )}

        {activeStory.content ? (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-10">
            <p className="text-sm leading-relaxed text-white">{activeStory.content}</p>
          </div>
        ) : null}

        {isOwnerStory && onDeleteStory ? (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              type="button"
              onClick={() => void handleDeleteCurrentStory()}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? 'Dang xoa...' : 'Xoa story'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

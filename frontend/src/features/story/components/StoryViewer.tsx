import { Ellipsis, Flag, Pause, Play, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatRelativeTime } from '@/shared/lib/date';

import type { StoryViewerProps } from '@/features/story/types/components';
import { useStoryViewer } from '@/features/story/hooks/useStoryViewer';

export const StoryViewer = (props: StoryViewerProps) => {
  const {
    t,
    author,
    stories,
    activeStory,
    progress,
    isPaused,
    setIsPaused,
    isMuted,
    setIsMuted,
    videoRef,
    menuRef,
    isOwnerStory,
    currentIndex,
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
    reactionOptions,
  } = useStoryViewer(props);

  if (!activeStory) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-2 sm:p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
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
            <Link to={`/profile/${author.id}`} className="inline-flex" aria-label={author.displayName}>
              <img src={author.avatarUrl} alt={author.displayName} className="h-9 w-9 rounded-full border border-white/50" />
            </Link>
            <div>
              <p className="text-sm font-semibold text-white">{author.displayName}</p>
              <p className="text-xs text-white/80">{formatRelativeTime(activeStory.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((previous) => !previous)}
              disabled={!isVideoStory}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                isVideoStory ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-black/20 text-white/50'
              }`}
              aria-label={isMuted ? t('story.viewer.soundOnAria') : t('story.viewer.soundOffAria')}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              aria-label={isPaused ? t('story.viewer.resumeAria') : t('story.viewer.pauseAria')}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((previous) => !previous)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
                aria-label={t('story.viewer.optionsAria')}
              >
                <Ellipsis size={16} />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-2xl border border-white/25 bg-slate-900/95 p-1.5 shadow-xl">
                  {isOwnerStory && onDeleteStory ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void handleDeleteCurrentStory();
                      }}
                      disabled={isDeleting}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Trash2 size={15} />
                      {isDeleting ? t('story.viewer.deleting') : t('story.viewer.deleteStory')}
                    </button>
                  ) : null}

                  {!isOwnerStory ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setReportReason('');
                        setReportReasonError(null);
                        setIsReportDialogOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-amber-300 transition hover:bg-amber-500/15"
                    >
                      <Flag size={15} />
                      {t('story.viewer.reportAdmin')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              aria-label={t('story.viewer.closeAria')}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <button
          type="button"
          onClick={goPrevious}
          className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-pointer"
          aria-label={t('story.viewer.previousAria')}
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-pointer"
          aria-label={t('story.viewer.nextAria')}
        />

        <div className="h-full w-full bg-black">
          {activeStory.mediaType === 'VIDEO' ? (
            <video
              ref={videoRef}
              src={activeStory.mediaUrl}
              className="h-full w-full object-contain"
              muted={isMuted}
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
            <img src={activeStory.mediaUrl} alt={author.displayName} className="h-full w-full object-contain" />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 pt-20">
          {activeStory.content ? <p className="text-sm leading-relaxed text-white">{activeStory.content}</p> : null}

          <div className="relative mt-4 flex w-full items-end justify-center gap-2">
            {floatingReactionIcons.map((item) => (
              <span
                key={`${activeStory.id}-reaction-fly-${item.id}`}
                className="story-reaction-fly-icon pointer-events-none absolute bottom-14 z-40 text-2xl"
                style={{ left: `${item.left}%` }}
              >
                {item.icon}
              </span>
            ))}

            <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-3 py-2 backdrop-blur-md shadow-lg">
              {reactionOptions.map((reactionOption) => {
                const isSelected = activeReactionType === reactionOption.type;
                return (
                  <button
                    key={`${activeStory.id}-reaction-option-${reactionOption.type}`}
                    type="button"
                    onClick={() => void setStoryReaction(reactionOption.type)}
                    disabled={isReactionSubmitting}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-3xl transition disabled:cursor-not-allowed disabled:opacity-70 ${
                      isSelected ? 'scale-110 bg-white/30' : 'hover:scale-105 hover:bg-white/15'
                    }`}
                    title={t(reactionOption.labelKey)}
                    aria-label={t(reactionOption.labelKey)}
                  >
                    {reactionOption.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {activeReactionType && !isOwnerStory ? (
            <p className="mt-2 text-center text-xs font-medium text-white/90">
              {getReactionMeta(activeReactionType).icon} {t('story.viewer.reactionAcknowledgement', { name: author.displayName })}
            </p>
          ) : null}
        </div>
      </div>

      {isReportDialogOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setIsReportDialogOpen(false);
              setReportReason('');
              setReportReasonError(null);
            }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
            aria-label={t('story.viewer.closeReportOverlayAria')}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

            <div className="space-y-4 p-5">
              <div>
                <h3 className="text-lg font-bold text-white">{t('story.viewer.reportTitle')}</h3>
                <p className="mt-1 text-sm text-slate-300">{t('story.viewer.reportDescription')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">{t('story.viewer.reasonLabel')}</label>
                <textarea
                  value={reportReason}
                  onChange={(event) => {
                    setReportReason(event.target.value);
                    if (reportReasonError) {
                      setReportReasonError(null);
                    }
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder={t('story.viewer.reasonPlaceholder')}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-amber-500"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{reportReason.length}/500</p>
                  {reportReasonError ? <p className="text-xs font-medium text-rose-300">{reportReasonError}</p> : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportDialogOpen(false);
                    setReportReason('');
                    setReportReasonError(null);
                  }}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmReportStory()}
                  disabled={isReportingStory}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isReportingStory ? t('common.loading') : t('story.viewer.sendReport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

import { Plus, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatRelativeTime } from '@/utils/date';

import type { StoryComposerModalProps, StoryListProps } from './interface';
import { StoryViewer } from './StoryViewer';
import { useStoryList } from './useStoryList';

const StoryComposerModal = ({
  isOpen,
  isSubmitting,
  selectedFile,
  previewUrl,
  content,
  errorMessage,
  onClose,
  onFileSelected,
  onContentChanged,
  onSubmit,
}: StoryComposerModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={t('story.composer.closeOverlayAria')}
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={t('story.composer.closeButtonAria')}
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('story.composer.title')}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('story.composer.subtitle')}</p>

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">{t('story.composer.mediaLabel')}</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
          className="mt-2 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
        />

        {previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {selectedFile?.type.startsWith('video/') ? (
              <video src={previewUrl} controls className="h-60 w-full object-cover sm:h-72" />
            ) : (
              <img src={previewUrl} alt={t('story.composer.previewAlt')} className="h-60 w-full object-cover sm:h-72" />
            )}
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">{t('story.composer.contentLabel')}</label>
        <textarea
          value={content}
          onChange={(event) => onContentChanged(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t('story.composer.contentPlaceholder')}
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">{content.length}/500</div>

        {errorMessage ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p> : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !selectedFile}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? t('story.composer.submitting') : t('story.composer.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const StoryList = (props: StoryListProps) => {
  const {
    t,
    navigate,
    scrollRef,
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
  } = useStoryList(props);

  const { currentUser, onActionToast } = props;

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('home.stories')}</h2>
        <button
          type="button"
          onClick={openComposer}
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Plus size={14} />
          {t('story.list.createButton')}
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
          {errorMessage}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
        onScroll={(event) => {
          const element = event.currentTarget;
          const remaining = element.scrollWidth - element.scrollLeft - element.clientWidth;
          if (remaining < 180 && hasMore && !isLoadingMore) {
            void loadMoreStories();
          }
        }}
      >
        {visibleGroups.map((group) => {
          const latestStory = group.stories[group.stories.length - 1];
          const cardImageUrl = latestStory?.mediaUrl ?? group.author.avatarUrl;
          const hasNew = group.hasUnviewed && !group.isMine;

          return (
            <button
              key={group.userId}
              type="button"
              onClick={() => void openStoryViewer(group)}
              className={`relative h-40 w-32 shrink-0 overflow-hidden rounded-2xl border text-left transition hover:scale-[1.02] sm:h-44 sm:w-40 ${
                hasNew
                  ? 'border-brand-500 ring-2 ring-brand-300 dark:border-brand-300 dark:ring-brand-400/40'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {latestStory?.mediaType === 'VIDEO' ? (
                <video src={cardImageUrl} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={cardImageUrl} alt={group.author.displayName} className="h-full w-full object-cover" loading="lazy" />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-2">
                <p className="line-clamp-2 text-xs font-semibold text-white">{group.isMine ? t('story.list.youLabel') : group.author.displayName}</p>
                {latestStory ? (
                  <p className="mt-0.5 text-[10px] text-white/80">{formatRelativeTime(latestStory.createdAt)}</p>
                ) : (
                  <p className="mt-0.5 text-[10px] text-white/80">{t('story.list.noStory')}</p>
                )}
              </div>

              <img
                src={group.author.avatarUrl}
                alt={group.author.displayName}
                onClick={(event) => {
                  event.stopPropagation();
                  void navigate(group.isMine ? '/profile' : `/profile/${group.userId}`);
                }}
                className="absolute left-2 top-2 h-8 w-8 cursor-pointer rounded-full border-2 border-white/80"
              />

              {group.isMine ? (
                <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
                  <Plus size={14} />
                </span>
              ) : null}
            </button>
          );
        })}

        {isLoading || isLoadingMore ? (
          <div className="flex h-44 w-32 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <RefreshCw size={18} className="animate-spin" />
          </div>
        ) : null}
      </div>

      <StoryComposerModal
        isOpen={isComposerOpen}
        isSubmitting={isCreatingStory}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        content={content}
        errorMessage={composerError}
        onClose={closeComposer}
        onFileSelected={handleFileSelected}
        onContentChanged={setContent}
        onSubmit={() => void handleCreateStory()}
      />

      {isViewerLoading ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 text-white">
          <div className="inline-flex items-center gap-2 rounded-xl bg-black/50 px-4 py-2 text-sm font-medium">
            <RefreshCw size={14} className="animate-spin" />
            {t('story.viewer.loading')}
          </div>
        </div>
      ) : null}

      {viewerGroup && viewerStories.length > 0 ? (
        <StoryViewer
          author={viewerGroup.author}
          stories={viewerStories}
          initialIndex={viewerStoryIndex}
          currentUserId={currentUser.id}
          onClose={closeViewer}
          onMarkViewed={markStoryViewed}
          onDeleteStory={removeStory}
          onReactionChange={handleStoryReactionChanged}
          onActionToast={onActionToast}
        />
      ) : null}
    </section>
  );
};

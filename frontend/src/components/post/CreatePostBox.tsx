import { ImagePlus, Smile, Video, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCreatePostBox } from './hooks/useCreatePostBox';
import type { CreatePostBoxProps } from './interface';

export const CreatePostBox = ({ currentUser, isSubmitting = false, onCreatePost }: CreatePostBoxProps) => {
  const {
    t,
    content,
    setContent,
    selectedMediaPreviewUrl,
    selectedMediaKind,
    mediaError,
    isIconPickerOpen,
    setIsIconPickerOpen,
    imageInputRef,
    videoInputRef,
    textareaRef,
    handleMediaFileChange,
    clearSelectedMedia,
    handleSubmit,
    handleCancelDraft,
    hasDraft,
    iconOptions,
  } = useCreatePostBox({ onCreatePost });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-start gap-3">
        <Link to="/profile" className="inline-flex shrink-0" aria-label={currentUser.fullName}>
          <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-11 w-11 rounded-full object-cover" />
        </Link>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('home.createPostPlaceholder')}
          rows={3}
          className="max-h-80 w-full resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] leading-7 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {selectedMediaPreviewUrl ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {selectedMediaKind === 'video' ? t('home.selectedVideo') : t('home.selectedImage')}
            </p>
            <button
              type="button"
              onClick={clearSelectedMedia}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <X size={13} />
              {t('home.removeMedia')}
            </button>
          </div>

          {selectedMediaKind === 'video' ? (
            <video src={selectedMediaPreviewUrl} controls className="max-h-[360px] w-full rounded-xl bg-black" />
          ) : (
            <img
              src={selectedMediaPreviewUrl}
              alt={t('home.selectedImage')}
              className="max-h-[360px] w-full rounded-xl object-contain"
            />
          )}
        </div>
      ) : null}

      {mediaError ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{mediaError}</p> : null}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            type="button"
            onClick={() => imageInputRef.current?.click()}
            title={t('home.addImage')}
          >
            <ImagePlus size={18} />
          </button>

          <button
            className="inline-flex items-center gap-1.5 rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            type="button"
            onClick={() => videoInputRef.current?.click()}
            title={t('home.addVideo')}
          >
            <Video size={18} />
          </button>

          <div className="relative">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              type="button"
              onClick={() => setIsIconPickerOpen((previous) => !previous)}
              title={t('home.addIcon')}
            >
              <Smile size={18} />
            </button>

            {isIconPickerOpen ? (
              <div className="absolute left-0 top-11 z-20 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setContent((previous) => `${previous}${previous.endsWith(' ') || previous.length === 0 ? '' : ' '}${icon}`);
                      setIsIconPickerOpen(false);
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleMediaFileChange(file);
              }
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleMediaFileChange(file);
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancelDraft}
            disabled={isSubmitting || !hasDraft}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !hasDraft}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? t('common.loading') : t('home.postButton')}
          </button>
        </div>
      </div>
    </section>
  );
};

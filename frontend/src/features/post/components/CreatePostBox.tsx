import { Check, ImagePlus, Smile, Video, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCreatePostBox } from '@/features/post/hooks/useCreatePostBox';
import type { CreatePostBoxProps } from '@/features/post/types/components';

export const CreatePostBox = ({ currentUser, isSubmitting = false, onCreatePost }: CreatePostBoxProps) => {
  const {
    t,
    content,
    setContent,
    visibility,
    setVisibility,
    selectedImagePreviewUrls,
    selectedVideoPreviewUrl,
    mediaError,
    isIconPickerOpen,
    setIsIconPickerOpen,
    imageInputRef,
    videoInputRef,
    textareaRef,
    handleImageFilesChange,
    handleVideoFileChange,
    removeSelectedImage,
    clearSelectedMedia,
    handleSubmit,
    handleCancelDraft,
    hasDraft,
    iconOptions,
    visibilityOptions,
  } = useCreatePostBox({ onCreatePost });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 sm:p-4">
      <div className="flex items-start gap-3">
        <Link to="/profile" className="inline-flex shrink-0" aria-label={currentUser.fullName}>
          <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11" />
        </Link>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('home.createPostPlaceholder')}
          rows={3}
          className="max-h-80 w-full resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-[15px] sm:leading-7"
        />
      </div>

      {selectedVideoPreviewUrl ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('home.selectedVideo')}
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

          <video src={selectedVideoPreviewUrl} controls className="max-h-[360px] w-full rounded-xl bg-black" />
        </div>
      ) : null}

      {selectedImagePreviewUrls.length > 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {`${t('home.selectedImage')} (${selectedImagePreviewUrls.length})`}
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {selectedImagePreviewUrls.map((previewUrl, index) => (
              <div key={`${previewUrl}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <img
                  src={previewUrl}
                  alt={`${t('home.selectedImage')} ${index + 1}`}
                  className="h-36 w-full bg-slate-100 object-cover dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => removeSelectedImage(index)}
                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Xóa ảnh đã chọn"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mediaError ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{mediaError}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Hien thi:
        </span>
        {visibilityOptions.map((option) => {
          const Icon = option.icon;
          const isActive = visibility === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisibility(option.value)}
              title={option.hint}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? `${option.chipClassName} shadow-sm`
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={12} />
              <span>{option.label}</span>
              {isActive ? <Check size={11} /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
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
              <div className="absolute left-0 top-11 z-20 flex w-[min(14rem,calc(100vw-3rem))] flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
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
            multiple
            className="hidden"
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) {
                handleImageFilesChange(files);
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
                handleVideoFileChange(file);
              }
            }}
          />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={handleCancelDraft}
            disabled={isSubmitting || !hasDraft}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:flex-none"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !hasDraft}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
          >
            {isSubmitting ? t('common.loading') : t('home.postButton')}
          </button>
        </div>
      </div>
    </section>
  );
};

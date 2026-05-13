import type { ChangeEvent } from 'react';
import { Check, PencilLine } from 'lucide-react';

import type { PostVisibility } from '@/features/post/types/contracts';
import { POST_VISIBILITY_OPTIONS } from '@/features/post/utils/visibility';

interface PostEditDialogProps {
  isOpen: boolean;
  isUpdatingPost: boolean;
  content: string;
  visibility: PostVisibility;
  errorMessage: string | null;
  onContentChange: (value: string) => void;
  onVisibilityChange: (value: PostVisibility) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const PostEditDialog = ({
  isOpen,
  isUpdatingPost,
  content,
  visibility,
  errorMessage,
  onContentChange,
  onVisibilityChange,
  onClose,
  onConfirm,
}: PostEditDialogProps) => {
  if (!isOpen) {
    return null;
  }

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(event.target.value);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={() => {
          if (isUpdatingPost) {
            return;
          }
          onClose();
        }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        aria-label="Dong popup chinh sua bai viet"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-sky-500 to-emerald-400" />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              <PencilLine size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Chinh sua bai viet</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Ban co the cap nhat noi dung va che do hien thi.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Noi dung
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              rows={5}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Cap nhat noi dung bai viet..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Che do hien thi
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {POST_VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = visibility === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onVisibilityChange(option.value)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={15} />
                      </span>
                      <span className="text-sm font-semibold">{option.label}</span>
                      {isActive ? (
                        <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Check size={12} />
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdatingPost}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isUpdatingPost}
              className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isUpdatingPost ? 'Dang cap nhat...' : 'Luu thay doi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Trash2 } from 'lucide-react';

import type { UseCommentReturn } from '@/features/comment/hooks/useComment';

type CommentDeleteModalProps = Pick<
  UseCommentReturn,
  | 't'
  | 'commentPendingDelete'
  | 'setCommentPendingDelete'
  | 'isDeletingCommentId'
  | 'handleConfirmDeleteComment'
>;

export const CommentDeleteModal = ({
  t,
  commentPendingDelete,
  setCommentPendingDelete,
  isDeletingCommentId,
  handleConfirmDeleteComment,
}: CommentDeleteModalProps) => {
  if (!commentPendingDelete) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={() => {
          if (isDeletingCommentId) {
            return;
          }

          setCommentPendingDelete(null);
        }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        aria-label={t('commentSection.deleteModalOverlayAria')}
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <Trash2 size={24} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('commentSection.deleteModalTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t('commentSection.deleteModalDescription')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCommentPendingDelete(null)}
              disabled={Boolean(isDeletingCommentId)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              {t('commentSection.cancel')}
            </button>

            <button
              type="button"
              onClick={() => void handleConfirmDeleteComment()}
              disabled={Boolean(isDeletingCommentId)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingCommentId ? t('commentSection.deleting') : t('commentSection.confirmDelete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

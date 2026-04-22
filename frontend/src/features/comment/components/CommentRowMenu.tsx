import { Ellipsis, Flag, Pencil, Trash2 } from 'lucide-react';

import type { Comment } from '@/features/comment/types/contracts';
import type { CommentRowController } from '@/features/comment/components/commentRow.types';

interface CommentRowMenuProps {
  comment: Comment;
  controller: Pick<
    CommentRowController,
    | 't'
    | 'isDeletingCommentId'
    | 'openMenuCommentId'
    | 'setOpenMenuCommentId'
    | 'canCurrentUserEditComment'
    | 'canCurrentUserDeleteComment'
    | 'canCurrentUserReportComment'
    | 'handleStartEditComment'
    | 'handleOpenDeleteCommentDialog'
    | 'handleOpenReportDialog'
  >;
}

export const CommentRowMenu = ({
  comment,
  controller,
}: CommentRowMenuProps) => {
  const {
    t,
    isDeletingCommentId,
    openMenuCommentId,
    setOpenMenuCommentId,
    canCurrentUserEditComment,
    canCurrentUserDeleteComment,
    canCurrentUserReportComment,
    handleStartEditComment,
    handleOpenDeleteCommentDialog,
    handleOpenReportDialog,
  } = controller;

  return (
    <div data-comment-menu-root data-comment-id={comment.id} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpenMenuCommentId((current) => (current === comment.id ? null : comment.id))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        aria-label={t('commentSection.commentMenuAria')}
      >
        <Ellipsis size={16} />
      </button>

      {openMenuCommentId === comment.id ? (
        <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {canCurrentUserEditComment(comment) ? (
            <button
              type="button"
              onClick={() => handleStartEditComment(comment)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Pencil size={15} />
              {t('commentSection.edit')}
            </button>
          ) : null}

          {canCurrentUserDeleteComment(comment) ? (
            <button
              type="button"
              onClick={() => handleOpenDeleteCommentDialog(comment)}
              disabled={isDeletingCommentId === comment.id}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <Trash2 size={15} />
              {isDeletingCommentId === comment.id ? t('commentSection.deleting') : t('commentSection.delete')}
            </button>
          ) : null}

          {canCurrentUserReportComment(comment) ? (
            <button
              type="button"
              onClick={() => handleOpenReportDialog(comment)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-amber-600 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
            >
              <Flag size={15} />
              {t('commentSection.reportToAdmin')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

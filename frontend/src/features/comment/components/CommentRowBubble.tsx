import { Link } from 'react-router-dom';

import type { Comment } from '@/features/comment/types/contracts';
import type { CommentRowController } from '@/features/comment/components/commentRow.types';

interface CommentRowBubbleProps {
  comment: Comment;
  actualLevel: number;
  repliedAuthor: Comment['author'] | null;
  controller: Pick<
    CommentRowController,
    | 't'
    | 'editingCommentId'
    | 'setEditingCommentId'
    | 'editingDraft'
    | 'setEditingDraft'
    | 'isUpdatingCommentId'
    | 'handleSaveEditedComment'
  >;
}

export const CommentRowBubble = ({
  comment,
  actualLevel,
  repliedAuthor,
  controller,
}: CommentRowBubbleProps) => {
  const {
    t,
    editingCommentId,
    setEditingCommentId,
    editingDraft,
    setEditingDraft,
    isUpdatingCommentId,
    handleSaveEditedComment,
  } = controller;

  return (
    <div className="relative max-w-full rounded-2xl bg-slate-100 px-3 py-2 dark:bg-slate-700/60">
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{comment.author.fullName}</p>
      {editingCommentId === comment.id ? (
        <div className="mt-1 space-y-2">
          <textarea
            value={editingDraft}
            onChange={(event) => setEditingDraft(event.target.value)}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCommentId(null);
                setEditingDraft('');
              }}
              disabled={isUpdatingCommentId === comment.id}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('commentSection.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveEditedComment()}
              disabled={isUpdatingCommentId === comment.id}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingCommentId === comment.id ? t('commentSection.saving') : t('commentSection.save')}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 break-words [overflow-wrap:anywhere] [word-break:break-word] dark:text-slate-300">
          {actualLevel > 0 && repliedAuthor ? (
            <>
              <Link
                to={`/profile/${repliedAuthor.id}`}
                className="inline text-[11px] font-medium text-brand-600 transition hover:text-brand-700 hover:underline dark:text-brand-300 dark:hover:text-brand-200"
              >
                @{repliedAuthor.fullName}
              </Link>{' '}
            </>
          ) : null}
          {comment.content}
        </p>
      )}
    </div>
  );
};

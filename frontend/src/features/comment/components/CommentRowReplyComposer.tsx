import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Comment } from '@/features/comment/types/contracts';
import type { CommentRowController } from '@/features/comment/components/commentRow.types';

interface CommentRowReplyComposerProps {
  comment: Comment;
  controller: Pick<
    CommentRowController,
    | 't'
    | 'currentUser'
    | 'replyTargetDisplayName'
    | 'replyDraft'
    | 'setReplyDraft'
    | 'isReplySubmittingCommentId'
    | 'handleCancelReply'
    | 'handleSubmitReply'
  >;
}

export const CommentRowReplyComposer = ({
  comment,
  controller,
}: CommentRowReplyComposerProps) => {
  const {
    t,
    currentUser,
    replyTargetDisplayName,
    replyDraft,
    setReplyDraft,
    isReplySubmittingCommentId,
    handleCancelReply,
    handleSubmitReply,
  } = controller;

  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900">
      <Link to="/profile" className="inline-flex shrink-0" aria-label={currentUser.fullName}>
        <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-7 w-7 rounded-full object-cover" />
      </Link>
      <input
        value={replyDraft}
        onChange={(event) => setReplyDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void handleSubmitReply();
          }
        }}
        placeholder={t('commentSection.replyPlaceholder', {
          name: replyTargetDisplayName || comment.author.fullName,
        })}
        className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={handleCancelReply}
        disabled={isReplySubmittingCommentId === comment.id}
        className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('commentSection.cancel')}
      </button>
      <button
        type="button"
        onClick={() => void handleSubmitReply()}
        disabled={isReplySubmittingCommentId === comment.id}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={12} />
        {isReplySubmittingCommentId === comment.id ? t('commentSection.sending') : t('commentSection.send')}
      </button>
    </div>
  );
};

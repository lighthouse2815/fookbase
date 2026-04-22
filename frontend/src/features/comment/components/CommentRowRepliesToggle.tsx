import type { CommentRowController } from '@/features/comment/components/commentRow.types';

interface CommentRowRepliesToggleProps {
  commentId: string;
  actualLevel: number;
  replyCount: number;
  isReplyThreadExpanded: boolean;
  controller: Pick<CommentRowController, 't' | 'toggleReplyThreadVisibility'>;
}

export const CommentRowRepliesToggle = ({
  commentId,
  actualLevel,
  replyCount,
  isReplyThreadExpanded,
  controller,
}: CommentRowRepliesToggleProps) => {
  const { t, toggleReplyThreadVisibility } = controller;

  return (
    <div className="mt-0 mb-2.5 pl-1">
      <button
        type="button"
        onClick={() => toggleReplyThreadVisibility(commentId, actualLevel)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span className="h-px w-6 bg-slate-300 dark:bg-slate-600" />
        <span>
          {isReplyThreadExpanded
            ? t('commentSection.hideReplies')
            : replyCount === 1
              ? t('commentSection.viewOneReply')
              : t('commentSection.viewMoreReplies', { count: replyCount })}
        </span>
      </button>
    </div>
  );
};

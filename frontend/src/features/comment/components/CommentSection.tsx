import type { CommentSectionProps } from '@/features/comment/types/components';
import { useComment } from '@/features/comment/hooks/useComment';

import { CommentComposer } from '@/features/comment/components/CommentComposer';
import { CommentDeleteModal } from '@/features/comment/components/CommentDeleteModal';
import { CommentReactionViewerModal } from '@/features/comment/components/CommentReactionViewerModal';
import { CommentReportModal } from '@/features/comment/components/CommentReportModal';
import { CommentRow } from '@/features/comment/components/CommentRow';

export const CommentSection = (props: CommentSectionProps) => {
  const commentController = useComment(props);
  const {
    t,
    isLoading,
    error,
    visibleCommentRows,
  } = commentController;

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
      {isLoading ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.loading')}</p> : null}
      {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="space-y-2">
        {visibleCommentRows.map((row) => (
          <CommentRow key={row.comment.id} row={row} controller={commentController} />
        ))}
      </div>

      <CommentComposer {...commentController} />
      <CommentReactionViewerModal {...commentController} />
      <CommentDeleteModal {...commentController} />
      <CommentReportModal {...commentController} />
    </div>
  );
};

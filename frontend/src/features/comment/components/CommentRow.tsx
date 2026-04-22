import { Link } from 'react-router-dom';

import { CommentRowBubble } from '@/features/comment/components/CommentRowBubble';
import { CommentRowFooter } from '@/features/comment/components/CommentRowFooter';
import { CommentRowMenu } from '@/features/comment/components/CommentRowMenu';
import { CommentRowRepliesToggle } from '@/features/comment/components/CommentRowRepliesToggle';
import { CommentRowReplyComposer } from '@/features/comment/components/CommentRowReplyComposer';
import type { CommentRowProps } from '@/features/comment/components/commentRow.types';
import {
  AUTO_EXPAND_ALL_FROM_LEVEL,
  countCommentsInTree,
  REPLY_INDENT_PER_LEVEL_PX,
} from '@/features/comment/utils/comment.util';

export const CommentRow = ({
  row,
  controller,
}: CommentRowProps) => {
  const { comment, actualLevel, visualLevel } = row;

  const directReplyCount = comment.replies?.length ?? 0;
  const totalDescendantReplyCount = Math.max(0, countCommentsInTree(comment) - 1);
  const replyCount = Math.max(comment.replyCount ?? 0, directReplyCount, totalDescendantReplyCount);
  const hasReplies = replyCount > 0;
  const canToggleReplies = hasReplies && actualLevel + 1 < AUTO_EXPAND_ALL_FROM_LEVEL;
  const isReplyThreadExpanded = Boolean(controller.expandedReplyThreadIds[comment.id]);
  const isReplyComposerOpen = controller.replyTargetCommentId === comment.id;
  const repliedAuthor = comment.parentCommentId
    ? controller.commentLookupById.get(comment.parentCommentId)?.author ?? null
    : null;
  const rowIndent = visualLevel * REPLY_INDENT_PER_LEVEL_PX;

  return (
    <div
      key={comment.id}
      className="flex w-full items-start gap-2"
      style={rowIndent > 0 ? { paddingInlineStart: `${rowIndent}px` } : undefined}
    >
      <Link to={`/profile/${comment.author.id}`} aria-label={comment.author.fullName} className="inline-flex shrink-0">
        <img src={comment.author.avatarUrl} alt={comment.author.fullName} className="h-8 w-8 rounded-full object-cover" />
      </Link>

      <div className="min-w-0 max-w-full flex-1">
        <CommentRowBubble
          comment={comment}
          actualLevel={actualLevel}
          repliedAuthor={repliedAuthor}
          controller={controller}
        />
        <CommentRowFooter comment={comment} controller={controller} />

        {isReplyComposerOpen ? <CommentRowReplyComposer comment={comment} controller={controller} /> : null}

        {canToggleReplies ? (
          <CommentRowRepliesToggle
            commentId={comment.id}
            actualLevel={actualLevel}
            replyCount={replyCount}
            isReplyThreadExpanded={isReplyThreadExpanded}
            controller={controller}
          />
        ) : null}
      </div>

      <CommentRowMenu comment={comment} controller={controller} />
    </div>
  );
};

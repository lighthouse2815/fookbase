import { formatRelativeTime } from '@/shared/lib/date';

import type { Comment } from '@/features/comment/types/contracts';
import type { CommentRowController } from '@/features/comment/components/commentRow.types';

interface CommentRowFooterProps {
  comment: Comment;
  controller: Pick<
    CommentRowController,
    | 't'
    | 'reactionOptions'
    | 'getReactionMeta'
    | 'getReactionButtonToneClass'
    | 'isCommentEdited'
    | 'isReactionUpdatingCommentId'
    | 'hoveredReactionCommentId'
    | 'setHoveredReactionCommentId'
    | 'handleSetReaction'
    | 'handleQuickLikeComment'
    | 'openReactionPicker'
    | 'closeReactionPickerWithDelay'
    | 'handleOpenReactionViewer'
    | 'handleStartReply'
  >;
}

export const CommentRowFooter = ({
  comment,
  controller,
}: CommentRowFooterProps) => {
  const {
    t,
    reactionOptions,
    getReactionMeta,
    getReactionButtonToneClass,
    isCommentEdited,
    isReactionUpdatingCommentId,
    hoveredReactionCommentId,
    setHoveredReactionCommentId,
    handleSetReaction,
    handleQuickLikeComment,
    openReactionPicker,
    closeReactionPickerWithDelay,
    handleOpenReactionViewer,
    handleStartReply,
  } = controller;

  return (
    <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-slate-400">
      <span>{formatRelativeTime(comment.createdAt)}</span>

      <div
        className="relative"
        onMouseEnter={() => openReactionPicker(comment.id)}
        onMouseLeave={() => closeReactionPickerWithDelay(comment.id)}
      >
        <button
          type="button"
          onClick={() => void handleQuickLikeComment(comment)}
          disabled={isReactionUpdatingCommentId === comment.id}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${getReactionButtonToneClass(comment.currentUserReactionType)}`}
        >
          {comment.currentUserReactionType ? <span>{getReactionMeta(comment.currentUserReactionType).icon}</span> : null}
          <span>{getReactionMeta(comment.currentUserReactionType).label}</span>
        </button>

        {hoveredReactionCommentId === comment.id ? (
          <div
            className="absolute bottom-full left-0 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            onMouseEnter={() => openReactionPicker(comment.id)}
            onMouseLeave={() => closeReactionPickerWithDelay(comment.id)}
          >
            {reactionOptions.map((reactionOption) => (
              <button
                key={reactionOption.type}
                type="button"
                onClick={() => {
                  setHoveredReactionCommentId(null);
                  void handleSetReaction(comment.id, reactionOption.type);
                }}
                disabled={isReactionUpdatingCommentId === comment.id}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                title={reactionOption.label}
                aria-label={reactionOption.label}
              >
                {reactionOption.icon}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => handleStartReply(comment)}
        className="font-medium transition hover:text-slate-600 dark:hover:text-slate-200"
      >
        {t('commentSection.reply')}
      </button>

      {isCommentEdited(comment) ? <span className="text-[10px] italic text-slate-400">{t('commentSection.edited')}</span> : null}

      {comment.reactionCount > 0 ? (
        <div className="ml-auto inline-flex items-center gap-1.5">
          <div className="inline-flex items-center">
            {comment.topReactionTypes.slice(0, 3).map((reactionType, index) => (
              <button
                key={`${comment.id}-top-reaction-${reactionType}-${index}`}
                type="button"
                onClick={() => {
                  void handleOpenReactionViewer(comment, reactionType);
                }}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-50 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-700 ${
                  index > 0 ? '-ml-1.5' : ''
                }`}
                title={getReactionMeta(reactionType).label}
              >
                {getReactionMeta(reactionType).icon}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              void handleOpenReactionViewer(comment, 'ALL');
            }}
            className="font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
          >
            {comment.reactionCount}
          </button>
        </div>
      ) : null}
    </div>
  );
};

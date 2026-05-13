import { MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import type { TFunction } from 'i18next';

import type { ReactionMeta } from '@/features/post/types/components';
import type { PostReactionType } from '@/features/post/types/contracts';
import { getReactionButtonToneClass } from '@/features/post/utils/reaction';

interface PostCardEngagementActionsProps {
  t: TFunction;
  postId: string;
  reactionCount: number;
  topReactionTypes: PostReactionType[];
  getReactionMeta: (reactionType?: PostReactionType | null) => ReactionMeta;
  onOpenReactionViewer: (filter: 'ALL' | PostReactionType) => void;
  commentCount: number;
  shareCount: number;
  onOpenComments: () => void;
  isReactionUpdating: boolean;
  currentUserReactionType: PostReactionType | null;
  onQuickLikePost: () => Promise<void>;
  isReactionPickerOpen: boolean;
  openReactionPicker: () => void;
  closeReactionPickerWithDelay: () => void;
  reactionOptions: ReactionMeta[];
  setIsReactionPickerOpen: (value: boolean) => void;
  onSetReaction: (reactionType: PostReactionType) => Promise<void>;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  onShare: () => Promise<void>;
  isSharing: boolean;
}

export const PostCardEngagementActions = ({
  t,
  postId,
  reactionCount,
  topReactionTypes,
  getReactionMeta,
  onOpenReactionViewer,
  commentCount,
  shareCount,
  onOpenComments,
  isReactionUpdating,
  currentUserReactionType,
  onQuickLikePost,
  isReactionPickerOpen,
  openReactionPicker,
  closeReactionPickerWithDelay,
  reactionOptions,
  setIsReactionPickerOpen,
  onSetReaction,
  isCommentsOpen,
  onToggleComments,
  onShare,
  isSharing,
}: PostCardEngagementActionsProps) => {
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        {reactionCount > 0 ? (
          <div className="inline-flex items-center gap-1.5">
            <div className="inline-flex items-center">
              {topReactionTypes.slice(0, 3).map((reactionType, index) => (
                <button
                  key={`${postId}-top-reaction-${reactionType}-${index}`}
                  type="button"
                  onClick={() => onOpenReactionViewer(reactionType)}
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
              onClick={() => onOpenReactionViewer('ALL')}
              className="font-semibold transition hover:text-slate-700 dark:hover:text-slate-200"
            >
              {reactionCount}
            </button>
          </div>
        ) : (
          <span>0</span>
        )}

        <div className="inline-flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenComments}
            className="font-semibold transition hover:text-slate-700 dark:hover:text-slate-200"
          >
            {t('post.commentCountLabel', { count: commentCount })}
          </button>
          <span className="font-semibold">
            {shareCount} {t('post.share')}
          </span>
        </div>
      </div>

      <div className="my-3 grid grid-cols-3 gap-1.5 border-y border-slate-100 py-2 dark:border-slate-700 sm:gap-2">
        <div className="relative" onMouseEnter={openReactionPicker} onMouseLeave={closeReactionPickerWithDelay}>
          <button
            type="button"
            onClick={() => void onQuickLikePost()}
            disabled={isReactionUpdating}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm ${getReactionButtonToneClass(currentUserReactionType)}`}
          >
            {currentUserReactionType ? <span>{getReactionMeta(currentUserReactionType).icon}</span> : <ThumbsUp size={16} />}
            <span>{currentUserReactionType ? getReactionMeta(currentUserReactionType).label : t('post.like')}</span>
          </button>

          {isReactionPickerOpen ? (
            <div
              className="absolute bottom-full left-0 z-20 mb-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              onMouseEnter={openReactionPicker}
              onMouseLeave={closeReactionPickerWithDelay}
            >
              {reactionOptions.map((reactionOption) => (
                <button
                  key={`${postId}-reaction-option-${reactionOption.type}`}
                  type="button"
                  onClick={() => {
                    setIsReactionPickerOpen(false);
                    void onSetReaction(reactionOption.type);
                  }}
                  disabled={isReactionUpdating}
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
          onClick={onToggleComments}
          className={`inline-flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium transition sm:text-sm ${
            isCommentsOpen
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <MessageCircle size={16} />
          {t('post.comment')}
        </button>
        <button
          type="button"
          onClick={() => void onShare()}
          disabled={isSharing}
          className="inline-flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-300 dark:hover:bg-slate-700 sm:text-sm"
        >
          <Share2 size={16} />
          {t('post.share')}
        </button>
      </div>
    </>
  );
};

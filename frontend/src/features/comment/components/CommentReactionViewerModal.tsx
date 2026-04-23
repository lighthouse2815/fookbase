import { Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import type { UseCommentReturn } from '@/features/comment/hooks/useComment';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

type CommentReactionViewerModalProps = Pick<
  UseCommentReturn,
  | 't'
  | 'reactionViewerComment'
  | 'reactionViewerTabs'
  | 'reactionViewerFilter'
  | 'setReactionViewerFilter'
  | 'reactionViewerError'
  | 'isReactionViewerLoading'
  | 'isReactionFriendshipLoading'
  | 'reactionFriendActionUserId'
  | 'filteredReactionViewerUsers'
  | 'closeReactionViewer'
  | 'getReactionMeta'
  | 'getReactionFriendActionMeta'
  | 'handleReactionFriendAction'
>;

export const CommentReactionViewerModal = ({
  t,
  reactionViewerComment,
  reactionViewerTabs,
  reactionViewerFilter,
  setReactionViewerFilter,
  reactionViewerError,
  isReactionViewerLoading,
  isReactionFriendshipLoading,
  reactionFriendActionUserId,
  filteredReactionViewerUsers,
  closeReactionViewer,
  getReactionMeta,
  getReactionFriendActionMeta,
  handleReactionFriendAction,
}: CommentReactionViewerModalProps) => {
  useBodyScrollLock(Boolean(reactionViewerComment));

  if (!reactionViewerComment) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={closeReactionViewer}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
        aria-label={t('commentSection.reactionModalOverlayAria')}
      />

      <div className="relative z-[97] w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {reactionViewerTabs.map((tab) => (
              <button
                key={`reaction-tab-${tab.type}`}
                type="button"
                onClick={() => setReactionViewerFilter(tab.type)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  reactionViewerFilter === tab.type
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={closeReactionViewer}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label={t('commentSection.reactionModalCloseButtonAria')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
          {isReactionViewerLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-300">
              <Loader2 size={16} className="animate-spin" />
              {t('commentSection.reactionModalLoading')}
            </div>
          ) : null}

          {reactionViewerError ? (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
              {reactionViewerError}
            </p>
          ) : null}

          {!isReactionViewerLoading && filteredReactionViewerUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">{t('commentSection.reactionModalEmpty')}</p>
          ) : null}

          {!isReactionViewerLoading
            ? filteredReactionViewerUsers.map((user) => {
                const friendActionMeta = getReactionFriendActionMeta(user.userId);
                const isFriendActionLoading = reactionFriendActionUserId === user.userId;

                return (
                  <div key={`${reactionViewerComment.id}-reaction-user-${user.userId}`} className="flex items-center gap-3 px-2 py-2">
                    <Link to={`/profile/${user.userId}`} className="relative inline-flex shrink-0" aria-label={user.displayName}>
                      <img src={user.avatarUrl} alt={user.displayName} className="h-11 w-11 rounded-full object-cover" />
                      <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 bg-slate-800 text-[11px]">
                        {getReactionMeta(user.reactionType).icon}
                      </span>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${user.userId}`}
                        className="truncate text-sm font-semibold text-slate-100 transition hover:text-brand-300"
                      >
                        {user.displayName}
                      </Link>
                    </div>

                    {friendActionMeta ? (
                      <button
                        type="button"
                        onClick={() => void handleReactionFriendAction(user)}
                        disabled={friendActionMeta.disabled || isFriendActionLoading || isReactionFriendshipLoading}
                        className={`${friendActionMeta.className} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        {isFriendActionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        {!isFriendActionLoading && friendActionMeta.action === 'ADD_FRIEND' ? <UserPlus size={13} /> : null}
                        {!isFriendActionLoading && friendActionMeta.action === 'FRIEND' ? <UserCheck size={13} /> : null}
                        <span>{isFriendActionLoading ? t('commentSection.processing') : friendActionMeta.label}</span>
                      </button>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};

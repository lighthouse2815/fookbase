import { Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePostReactionViewerModal } from '@/features/post/hooks/usePostReactionViewerModal';
import type { PostReactionViewerModalProps } from '@/features/post/types/components';

export const PostReactionViewerModal = (props: PostReactionViewerModalProps) => {
  const {
    filter,
    setFilter,
    error,
    isLoading,
    isFriendshipLoading,
    friendActionUserId,
    tabs,
    filteredUsers,
    reactionMetaByType,
    getFriendActionMeta,
    handleFriendAction,
  } = usePostReactionViewerModal(props);

  const { postId, isOpen, onClose } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={() => {
          if (!friendActionUserId) {
            onClose();
          }
        }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
        aria-label="Dong popup reaction"
      />

      <div className="relative z-[97] w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={`reaction-tab-${tab.type}`}
                type="button"
                onClick={() => setFilter(tab.type)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab.type ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!friendActionUserId) {
                onClose();
              }
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            aria-label="Dong popup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-300">
              <Loader2 size={16} className="animate-spin" />
              Dang tai danh sach reaction...
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
              {error}
            </p>
          ) : null}

          {!isLoading && filteredUsers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Chua co reaction nao trong nhom nay.</p>
          ) : null}

          {!isLoading
            ? filteredUsers.map((user) => {
                const friendActionMeta = getFriendActionMeta(user.userId);
                const isFriendActionLoading = friendActionUserId === user.userId;

                return (
                  <div key={`${postId}-reaction-user-${user.userId}`} className="flex items-center gap-3 px-2 py-2">
                    <Link to={`/profile/${user.userId}`} className="relative inline-flex shrink-0" aria-label={user.displayName}>
                      <img src={user.avatarUrl} alt={user.displayName} className="h-11 w-11 rounded-full object-cover" />
                      <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 bg-slate-800 text-[11px]">
                        {reactionMetaByType[user.reactionType].icon}
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
                        onClick={() => void handleFriendAction(user)}
                        disabled={friendActionMeta.disabled || isFriendActionLoading || isFriendshipLoading}
                        className={`${friendActionMeta.className} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        {isFriendActionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        {!isFriendActionLoading && friendActionMeta.label === 'Them ban be' ? <UserPlus size={13} /> : null}
                        {!isFriendActionLoading && friendActionMeta.label === 'Ban be' ? <UserCheck size={13} /> : null}
                        <span>{isFriendActionLoading ? 'Dang xu ly...' : friendActionMeta.label}</span>
                      </button>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
};

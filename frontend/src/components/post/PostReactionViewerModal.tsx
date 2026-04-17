import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { friendshipService } from '@/services/friendshipService';
import { postService } from '@/services/postService';
import type {
  CommentReactionFriendshipStatus,
  PostReactionType,
  PostReactionUser,
} from '@/interface/post';
import { getApiErrorMessage } from '@/utils/apiError';

type ReactionFilterTab = 'ALL' | PostReactionType;

interface PostReactionViewerModalProps {
  postId: string;
  isOpen: boolean;
  initialFilter: ReactionFilterTab;
  currentUserId: string;
  onClose: () => void;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

interface ReactionMeta {
  type: PostReactionType;
  label: string;
  icon: string;
}

interface ReactionFriendState {
  status: CommentReactionFriendshipStatus;
  requestId?: string;
}

const REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', label: 'Thich', icon: '👍' },
  { type: 'WOW', label: 'Wow', icon: '😮' },
  { type: 'SAD', label: 'Sad', icon: '😢' },
  { type: 'ANGRY', label: 'Gian', icon: '😡' },
  { type: 'HAHA', label: 'Haha', icon: '😂' },
  { type: 'LOVE', label: 'Tim', icon: '❤️' },
];

const REACTION_META_BY_TYPE = REACTION_OPTIONS.reduce<Record<PostReactionType, ReactionMeta>>(
  (accumulator, item) => {
    accumulator[item.type] = item;
    return accumulator;
  },
  {
    LIKE: REACTION_OPTIONS[0],
    WOW: REACTION_OPTIONS[1],
    SAD: REACTION_OPTIONS[2],
    ANGRY: REACTION_OPTIONS[3],
    HAHA: REACTION_OPTIONS[4],
    LOVE: REACTION_OPTIONS[5],
  },
);

export const PostReactionViewerModal = ({
  postId,
  isOpen,
  initialFilter,
  currentUserId,
  onClose,
  onActionToast,
}: PostReactionViewerModalProps) => {
  const [users, setUsers] = useState<PostReactionUser[]>([]);
  const [filter, setFilter] = useState<ReactionFilterTab>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFriendshipLoading, setIsFriendshipLoading] = useState(false);
  const [friendStatesByUserId, setFriendStatesByUserId] = useState<Record<string, ReactionFriendState>>({});
  const [friendActionUserId, setFriendActionUserId] = useState<string | null>(null);

  const normalizeId = (value: string) => value.trim().toLowerCase();
  const normalizedCurrentUserId = normalizeId(currentUserId);

  const buildFriendStateLookup = (
    friendIds: string[],
    receivedRequests: Array<{ id: string; requestId: string }>,
    sentRequests: Array<{ id: string; requestId: string }>,
  ): Record<string, ReactionFriendState> => {
    const states: Record<string, ReactionFriendState> = {};

    friendIds.forEach((id) => {
      states[normalizeId(id)] = { status: 'FRIEND' };
    });

    sentRequests.forEach((request) => {
      const key = normalizeId(request.id);
      if (states[key]?.status === 'FRIEND') {
        return;
      }

      states[key] = {
        status: 'REQUEST_SENT',
        requestId: request.requestId,
      };
    });

    receivedRequests.forEach((request) => {
      const key = normalizeId(request.id);
      if (states[key]) {
        return;
      }

      states[key] = {
        status: 'REQUEST_RECEIVED',
        requestId: request.requestId,
      };
    });

    return states;
  };

  const getFriendState = (userId: string): ReactionFriendState => {
    if (normalizeId(userId) === normalizedCurrentUserId) {
      return { status: 'SELF' };
    }

    return friendStatesByUserId[normalizeId(userId)] ?? { status: 'NONE' };
  };

  const getFriendActionMeta = (userId: string): {
    label: string;
    disabled: boolean;
    className: string;
  } | null => {
    const state = getFriendState(userId);
    if (state.status === 'SELF') {
      return null;
    }

    if (state.status === 'FRIEND') {
      return {
        label: 'Ban be',
        disabled: true,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
      };
    }

    if (state.status === 'REQUEST_SENT') {
      return {
        label: 'Huy loi moi',
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
      };
    }

    if (state.status === 'REQUEST_RECEIVED') {
      return {
        label: 'Xac nhan',
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700',
      };
    }

    return {
      label: 'Them ban be',
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700',
    };
  };

  const handleFriendAction = async (user: PostReactionUser) => {
    if (friendActionUserId) {
      return;
    }

    const state = getFriendState(user.userId);
    if (state.status === 'SELF' || state.status === 'FRIEND') {
      return;
    }

    setFriendActionUserId(user.userId);
    setError(null);

    try {
      if (state.status === 'NONE') {
        await friendshipService.sendFriendRequest(user.userId);
        setFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: {
            status: 'REQUEST_SENT',
            requestId: user.userId,
          },
        }));
      } else if (state.status === 'REQUEST_SENT') {
        await friendshipService.cancelSentRequest(state.requestId ?? user.userId);
        setFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'NONE' },
        }));
      } else if (state.status === 'REQUEST_RECEIVED') {
        await friendshipService.acceptFriendRequest(state.requestId ?? user.userId);
        setFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'FRIEND' },
        }));
      }
    } catch (actionError) {
      const message = getApiErrorMessage(actionError, 'Khong the cap nhat trang thai ban be.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setFriendActionUserId(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isActive = true;
    setFilter(initialFilter);
    setError(null);
    setIsLoading(true);
    setIsFriendshipLoading(true);
    setUsers([]);
    setFriendStatesByUserId({});

    const load = async () => {
      const [reactionUsersResult, friendsResult, receivedRequestsResult, sentRequestsResult] = await Promise.allSettled([
        postService.getPostReactionUsers(postId),
        friendshipService.getFriends(),
        friendshipService.getReceivedRequests(),
        friendshipService.getSentRequests(),
      ]);

      if (!isActive) {
        return;
      }

      if (reactionUsersResult.status === 'fulfilled') {
        setUsers(reactionUsersResult.value.users);
      } else {
        setError(getApiErrorMessage(reactionUsersResult.reason, 'Khong the tai danh sach reaction.'));
      }

      const friendIds = friendsResult.status === 'fulfilled' ? friendsResult.value.map((friend) => friend.id) : [];
      const receivedRequests = receivedRequestsResult.status === 'fulfilled'
        ? receivedRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
        : [];
      const sentRequests = sentRequestsResult.status === 'fulfilled'
        ? sentRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
        : [];

      setFriendStatesByUserId(buildFriendStateLookup(friendIds, receivedRequests, sentRequests));
      setIsLoading(false);
      setIsFriendshipLoading(false);
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [initialFilter, isOpen, postId]);

  const tabs = useMemo(() => {
    const countsByType = users.reduce<Record<PostReactionType, number>>(
      (accumulator, user) => {
        accumulator[user.reactionType] = (accumulator[user.reactionType] ?? 0) + 1;
        return accumulator;
      },
      {
        LIKE: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
        HAHA: 0,
        LOVE: 0,
      },
    );

    return [
      { type: 'ALL' as ReactionFilterTab, label: 'Tat ca', count: users.length },
      ...REACTION_OPTIONS.filter((reaction) => countsByType[reaction.type] > 0).map((reaction) => ({
        type: reaction.type as ReactionFilterTab,
        label: reaction.icon,
        count: countsByType[reaction.type],
      })),
    ];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (filter === 'ALL') {
      return users;
    }

    return users.filter((user) => user.reactionType === filter);
  }, [filter, users]);

  useEffect(() => {
    if (filter === 'ALL') {
      return;
    }

    const hasMatching = users.some((user) => user.reactionType === filter);
    if (!hasMatching) {
      setFilter('ALL');
    }
  }, [filter, users]);

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
                  filter === tab.type
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
                        {REACTION_META_BY_TYPE[user.reactionType].icon}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { Ellipsis, Flag, Loader2, Pencil, Send, Trash2, UserCheck, UserPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { commentService } from '../services/commentService';
import { friendshipService } from '../services/friendshipService';
import { postReportService } from '../services/postReportService';
import type { Comment, CommentReactionFriendshipStatus, CommentReactionType, CommentReactionUser } from '../types/post';
import type { User } from '../types/user';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  initialComments: Comment[];
  initialCommentCount?: number;
  currentUser: User;
  onCommentCountChange?: (count: number) => void;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_VISUAL_REPLY_LEVEL = 2;
const REPLY_INDENT_PER_LEVEL_PX = 18;
const AUTO_EXPAND_ALL_FROM_LEVEL = 3;

interface ReactionMeta {
  type: CommentReactionType;
  label: string;
  icon: string;
}

const REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', label: 'Thich', icon: '👍' },
  { type: 'WOW', label: 'Wow', icon: '😮' },
  { type: 'SAD', label: 'Sad', icon: '😢' },
  { type: 'ANGRY', label: 'Gian', icon: '😡' },
  { type: 'HAHA', label: 'Haha', icon: '😂' },
  { type: 'LOVE', label: 'Tim', icon: '❤️' },
];

const REACTION_META_BY_TYPE = REACTION_OPTIONS.reduce<Record<CommentReactionType, ReactionMeta>>(
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

type ReactionFilterTab = 'ALL' | CommentReactionType;

interface ReactionFriendState {
  status: CommentReactionFriendshipStatus;
  requestId?: string;
}

interface VisibleCommentRow {
  comment: Comment;
  actualLevel: number;
  visualLevel: number;
}

export const CommentSection = ({
  postId,
  postAuthorId,
  initialComments,
  initialCommentCount,
  currentUser,
  onCommentCountChange,
  onActionToast,
}: CommentSectionProps) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount ?? initialComments.length);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTargetCommentId, setReplyTargetCommentId] = useState<string | null>(null);
  const [replyTargetDisplayName, setReplyTargetDisplayName] = useState<string>('');
  const [replyDraft, setReplyDraft] = useState('');
  const [isReplySubmittingCommentId, setIsReplySubmittingCommentId] = useState<string | null>(null);
  const [isReactionUpdatingCommentId, setIsReactionUpdatingCommentId] = useState<string | null>(null);
  const [hoveredReactionCommentId, setHoveredReactionCommentId] = useState<string | null>(null);
  const [isUpdatingCommentId, setIsUpdatingCommentId] = useState<string | null>(null);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [commentPendingDelete, setCommentPendingDelete] = useState<Comment | null>(null);
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);
  const [expandedReplyThreadIds, setExpandedReplyThreadIds] = useState<Record<string, true>>({});
  const [reactionViewerComment, setReactionViewerComment] = useState<Comment | null>(null);
  const [reactionViewerUsers, setReactionViewerUsers] = useState<CommentReactionUser[]>([]);
  const [reactionViewerFilter, setReactionViewerFilter] = useState<ReactionFilterTab>('ALL');
  const [reactionViewerError, setReactionViewerError] = useState<string | null>(null);
  const [isReactionViewerLoading, setIsReactionViewerLoading] = useState(false);
  const [isReactionFriendshipLoading, setIsReactionFriendshipLoading] = useState(false);
  const [reactionFriendStatesByUserId, setReactionFriendStatesByUserId] = useState<Record<string, ReactionFriendState>>(
    {},
  );
  const [reactionFriendActionUserId, setReactionFriendActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reactionHoverCloseTimeoutRef = useRef<number | null>(null);

  const normalizeId = (value: string) => value.trim().toLowerCase();
  const normalizedCurrentUserId = normalizeId(currentUser.id);
  const normalizedPostAuthorId = normalizeId(postAuthorId);

  const isCommentEdited = (comment: Comment) => {
    if (!comment.updatedAt) {
      return false;
    }

    const createdAtMs = Date.parse(comment.createdAt);
    const updatedAtMs = Date.parse(comment.updatedAt);
    if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) {
      return false;
    }

    return updatedAtMs > createdAtMs + 1000;
  };

  const getReactionMeta = (reactionType?: CommentReactionType | null): ReactionMeta => {
    if (!reactionType) {
      return REACTION_META_BY_TYPE.LIKE;
    }

    return REACTION_META_BY_TYPE[reactionType] ?? REACTION_META_BY_TYPE.LIKE;
  };

  const getReactionButtonToneClass = (reactionType?: CommentReactionType | null) => {
    if (!reactionType) {
      return 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200';
    }

    if (reactionType === 'LIKE') {
      return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/40';
    }

    if (reactionType === 'ANGRY' || reactionType === 'LOVE') {
      return 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/40';
    }

    return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/40';
  };

  const normalizeCommentTree = (comment: Comment): Comment => {
    const normalizedReplies = Array.isArray(comment.replies)
      ? comment.replies.map((reply) => normalizeCommentTree(reply))
      : [];

    return {
      ...comment,
      parentCommentId: comment.parentCommentId ?? null,
      replies: normalizedReplies,
      replyCount: typeof comment.replyCount === 'number'
        ? Math.max(0, comment.replyCount)
        : normalizedReplies.length,
    };
  };

  const replaceCommentInTree = (items: Comment[], updatedComment: Comment): Comment[] =>
    items.map((comment) => {
      if (comment.id === updatedComment.id) {
        return normalizeCommentTree(updatedComment);
      }

      const currentReplies = comment.replies ?? [];
      if (currentReplies.length === 0) {
        return comment;
      }

      const nextReplies = replaceCommentInTree(currentReplies, updatedComment);
      return {
        ...comment,
        replies: nextReplies,
        replyCount: nextReplies.length,
      };
    });

  const removeCommentFromTree = (items: Comment[], targetCommentId: string): Comment[] =>
    items
      .filter((comment) => comment.id !== targetCommentId)
      .map((comment) => {
        const nextReplies = removeCommentFromTree(comment.replies ?? [], targetCommentId);
        return {
          ...comment,
          replies: nextReplies,
          replyCount: nextReplies.length,
        };
      });

  const addReplyToTree = (items: Comment[], parentCommentId: string, reply: Comment): Comment[] =>
    items.map((comment) => {
      if (comment.id === parentCommentId) {
        const existingReplies = comment.replies ?? [];
        const nextReplies = [...existingReplies, normalizeCommentTree(reply)];

        return {
          ...comment,
          replies: nextReplies,
          replyCount: nextReplies.length,
        };
      }

      const existingReplies = comment.replies ?? [];
      if (existingReplies.length === 0) {
        return comment;
      }

      const nextReplies = addReplyToTree(existingReplies, parentCommentId, reply);

      return {
        ...comment,
        replies: nextReplies,
        replyCount: nextReplies.length,
      };
    });

  const hasCommentInTree = (items: Comment[], commentId: string): boolean =>
    items.some((comment) => comment.id === commentId || hasCommentInTree(comment.replies ?? [], commentId));

  const countCommentsInTree = (comment: Comment): number =>
    1 + (comment.replies ?? []).reduce((total, reply) => total + countCommentsInTree(reply), 0);

  const commentLookupById = useMemo(() => {
    const lookup = new Map<string, Comment>();

    const traverse = (items: Comment[]) => {
      items.forEach((item) => {
        lookup.set(item.id, item);
        traverse(item.replies ?? []);
      });
    };

    traverse(comments);
    return lookup;
  }, [comments]);

  const collectDescendantCommentIds = (commentId: string): string[] => {
    const root = commentLookupById.get(commentId);
    if (!root) {
      return [];
    }

    const ids: string[] = [];
    const stack: Comment[] = [...(root.replies ?? [])];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      ids.push(current.id);
      if (current.replies && current.replies.length > 0) {
        stack.push(...current.replies);
      }
    }

    return ids;
  };

  const toggleReplyThreadVisibility = (commentId: string, actualLevel: number) => {
    setExpandedReplyThreadIds((current) => {
      const descendants = collectDescendantCommentIds(commentId);
      const next = { ...current };

      if (next[commentId]) {
        delete next[commentId];
        descendants.forEach((id) => {
          delete next[id];
        });
        return next;
      }

      descendants.forEach((id) => {
        delete next[id];
      });
      next[commentId] = true;

      if (actualLevel + 2 >= AUTO_EXPAND_ALL_FROM_LEVEL) {
        descendants.forEach((id) => {
          next[id] = true;
        });
      }

      return next;
    });
  };

  const visibleCommentRows = useMemo(() => {
    const flatten = (items: Comment[], level: number): VisibleCommentRow[] =>
      items.flatMap((item) => {
        const row: VisibleCommentRow = {
          comment: item,
          actualLevel: level,
          visualLevel: Math.min(level, MAX_VISUAL_REPLY_LEVEL),
        };

        const children = item.replies ?? [];
        if (children.length === 0 || !expandedReplyThreadIds[item.id]) {
          return [row];
        }

        return [row, ...flatten(children, level + 1)];
      });

    return flatten(comments, 0);
  }, [comments, expandedReplyThreadIds]);

  useEffect(() => {
    let isActive = true;

    const loadComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await commentService.getCommentsByPostId(postId, 1, DEFAULT_PAGE_SIZE);

        if (!isActive) {
          return;
        }

        setComments(response.items.map((comment) => normalizeCommentTree(comment)));
        setCommentCount(response.totalCount);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(getApiErrorMessage(loadError, 'Unable to load comments.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isActive = false;
    };
  }, [postId]);

  useEffect(() => {
    onCommentCountChange?.(commentCount);
  }, [commentCount, onCommentCountChange]);

  useEffect(() => {
    setOpenMenuCommentId(null);
    setEditingCommentId(null);
    setEditingDraft('');
    setReplyTargetCommentId(null);
    setReplyTargetDisplayName('');
    setReplyDraft('');
    setIsReplySubmittingCommentId(null);
    setHoveredReactionCommentId(null);
    setCommentPendingDelete(null);
    setReportReason('');
    setReportReasonError(null);
    setReportingComment(null);
    setExpandedReplyThreadIds({});
    setReactionViewerComment(null);
    setReactionViewerUsers([]);
    setReactionViewerFilter('ALL');
    setReactionViewerError(null);
    setReactionFriendStatesByUserId({});
    setReactionFriendActionUserId(null);
  }, [postId]);

  useEffect(() => {
    return () => {
      if (reactionHoverCloseTimeoutRef.current) {
        window.clearTimeout(reactionHoverCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!openMenuCommentId) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const menuRoot = target.closest('[data-comment-menu-root]');
      const clickedCommentId = menuRoot?.getAttribute('data-comment-id');

      if (clickedCommentId !== openMenuCommentId) {
        setOpenMenuCommentId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openMenuCommentId]);

  const handleAddComment = async () => {
    const trimmed = draft.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdComment = normalizeCommentTree(await commentService.createComment(postId, trimmed));

      setComments((previous) => [...previous, createdComment]);
      setCommentCount((previous) => previous + 1);
      setDraft('');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to send comment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartReply = (comment: Comment) => {
    setReplyTargetCommentId(comment.id);
    setReplyTargetDisplayName(comment.author.fullName);
    setReplyDraft('');
    setOpenMenuCommentId(null);
    setError(null);
  };

  const handleCancelReply = () => {
    if (isReplySubmittingCommentId) {
      return;
    }

    setReplyTargetCommentId(null);
    setReplyTargetDisplayName('');
    setReplyDraft('');
  };

  const handleSubmitReply = async () => {
    const trimmed = replyDraft.trim();
    if (!replyTargetCommentId || !trimmed || isReplySubmittingCommentId) {
      return;
    }

    setIsReplySubmittingCommentId(replyTargetCommentId);
    setError(null);

    try {
      const createdReply = normalizeCommentTree(
        await commentService.createComment(postId, trimmed, replyTargetCommentId),
      );

      setComments((previous) => {
        if (!hasCommentInTree(previous, replyTargetCommentId)) {
          return previous;
        }

        return addReplyToTree(previous, replyTargetCommentId, createdReply);
      });
      setCommentCount((previous) => previous + 1);
      setExpandedReplyThreadIds((current) => ({
        ...current,
        [replyTargetCommentId]: true,
      }));
      setReplyTargetCommentId(null);
      setReplyTargetDisplayName('');
      setReplyDraft('');
      onActionToast?.('Da gui tra loi', 'success');
    } catch (replyError) {
      const message = getApiErrorMessage(replyError, 'Khong the gui tra loi.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReplySubmittingCommentId(null);
    }
  };

  const handleSetReaction = async (commentId: string, reactionType: CommentReactionType) => {
    if (isReactionUpdatingCommentId) {
      return;
    }

    setIsReactionUpdatingCommentId(commentId);
    setError(null);

    try {
      await commentService.setReaction(commentId, reactionType);
      const refreshedComment = await commentService.getCommentById(commentId);
      setComments((previous) => replaceCommentInTree(previous, refreshedComment));
    } catch (reactionError) {
      const message = getApiErrorMessage(reactionError, 'Khong the cap nhat reaction cho binh luan.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReactionUpdatingCommentId(null);
    }
  };

  const handleRemoveReaction = async (commentId: string) => {
    if (isReactionUpdatingCommentId) {
      return;
    }

    setIsReactionUpdatingCommentId(commentId);
    setError(null);

    try {
      await commentService.removeReaction(commentId);
      const refreshedComment = await commentService.getCommentById(commentId);
      setComments((previous) => replaceCommentInTree(previous, refreshedComment));
    } catch (reactionError) {
      const message = getApiErrorMessage(reactionError, 'Khong the xoa reaction cua binh luan.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReactionUpdatingCommentId(null);
    }
  };

  const handleQuickLikeComment = async (comment: Comment) => {
    setHoveredReactionCommentId(null);
    if (comment.currentUserReactionType) {
      await handleRemoveReaction(comment.id);
      return;
    }

    await handleSetReaction(comment.id, 'LIKE');
  };

  const openReactionPicker = (commentId: string) => {
    if (reactionHoverCloseTimeoutRef.current) {
      window.clearTimeout(reactionHoverCloseTimeoutRef.current);
      reactionHoverCloseTimeoutRef.current = null;
    }

    setHoveredReactionCommentId(commentId);
  };

  const closeReactionPickerWithDelay = (commentId: string) => {
    if (reactionHoverCloseTimeoutRef.current) {
      window.clearTimeout(reactionHoverCloseTimeoutRef.current);
    }

    reactionHoverCloseTimeoutRef.current = window.setTimeout(() => {
      setHoveredReactionCommentId((current) => (current === commentId ? null : current));
      reactionHoverCloseTimeoutRef.current = null;
    }, 150);
  };

  const buildReactionFriendStateLookup = (
    friendsIds: string[],
    receivedRequests: Array<{ id: string; requestId: string }>,
    sentRequests: Array<{ id: string; requestId: string }>,
  ): Record<string, ReactionFriendState> => {
    const states: Record<string, ReactionFriendState> = {};

    friendsIds.forEach((id) => {
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

  const getReactionFriendState = (userId: string): ReactionFriendState => {
    if (normalizeId(userId) === normalizedCurrentUserId) {
      return { status: 'SELF' };
    }

    return reactionFriendStatesByUserId[normalizeId(userId)] ?? { status: 'NONE' };
  };

  const closeReactionViewer = () => {
    if (reactionFriendActionUserId) {
      return;
    }

    setReactionViewerComment(null);
    setReactionViewerUsers([]);
    setReactionViewerFilter('ALL');
    setReactionViewerError(null);
    setReactionFriendStatesByUserId({});
  };

  const handleOpenReactionViewer = async (comment: Comment, filter: ReactionFilterTab) => {
    setReactionViewerComment(comment);
    setReactionViewerFilter(filter);
    setReactionViewerError(null);
    setIsReactionViewerLoading(true);
    setIsReactionFriendshipLoading(true);
    setReactionFriendStatesByUserId({});

    const [reactionUsersResult, friendsResult, receivedRequestsResult, sentRequestsResult] = await Promise.allSettled([
      commentService.getCommentReactionUsers(comment.id),
      friendshipService.getFriends(),
      friendshipService.getReceivedRequests(),
      friendshipService.getSentRequests(),
    ]);

    if (reactionUsersResult.status === 'fulfilled') {
      setReactionViewerUsers(reactionUsersResult.value.users);
    } else {
      setReactionViewerUsers([]);
      setReactionViewerError(getApiErrorMessage(reactionUsersResult.reason, 'Khong the tai danh sach reaction.'));
    }

    const friendIds = friendsResult.status === 'fulfilled' ? friendsResult.value.map((friend) => friend.id) : [];
    const receivedRequests = receivedRequestsResult.status === 'fulfilled'
      ? receivedRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
      : [];
    const sentRequests = sentRequestsResult.status === 'fulfilled'
      ? sentRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
      : [];

    setReactionFriendStatesByUserId(buildReactionFriendStateLookup(friendIds, receivedRequests, sentRequests));
    setIsReactionViewerLoading(false);
    setIsReactionFriendshipLoading(false);
  };

  const handleReactionFriendAction = async (user: CommentReactionUser) => {
    if (reactionFriendActionUserId) {
      return;
    }

    const state = getReactionFriendState(user.userId);
    if (state.status === 'SELF' || state.status === 'FRIEND') {
      return;
    }

    setReactionFriendActionUserId(user.userId);
    setReactionViewerError(null);

    try {
      if (state.status === 'NONE') {
        await friendshipService.sendFriendRequest(user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: {
            status: 'REQUEST_SENT',
            requestId: user.userId,
          },
        }));
      } else if (state.status === 'REQUEST_SENT') {
        await friendshipService.cancelSentRequest(state.requestId ?? user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'NONE' },
        }));
      } else if (state.status === 'REQUEST_RECEIVED') {
        await friendshipService.acceptFriendRequest(state.requestId ?? user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'FRIEND' },
        }));
      }
    } catch (actionError) {
      const message = getApiErrorMessage(actionError, 'Khong the cap nhat trang thai ban be.');
      setReactionViewerError(message);
      onActionToast?.(message, 'error');
    } finally {
      setReactionFriendActionUserId(null);
    }
  };

  const reactionViewerTabs = useMemo(() => {
    const countsByType = reactionViewerUsers.reduce<Record<CommentReactionType, number>>(
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
      {
        type: 'ALL' as ReactionFilterTab,
        label: 'Tat ca',
        count: reactionViewerUsers.length,
      },
      ...REACTION_OPTIONS.filter((reaction) => countsByType[reaction.type] > 0).map((reaction) => ({
        type: reaction.type as ReactionFilterTab,
        label: reaction.icon,
        count: countsByType[reaction.type],
      })),
    ];
  }, [reactionViewerUsers]);

  const filteredReactionViewerUsers = useMemo(() => {
    if (reactionViewerFilter === 'ALL') {
      return reactionViewerUsers;
    }

    return reactionViewerUsers.filter((user) => user.reactionType === reactionViewerFilter);
  }, [reactionViewerFilter, reactionViewerUsers]);

  useEffect(() => {
    if (reactionViewerFilter === 'ALL') {
      return;
    }

    const hasAtLeastOneMatchingReaction = reactionViewerUsers.some((user) => user.reactionType === reactionViewerFilter);
    if (!hasAtLeastOneMatchingReaction) {
      setReactionViewerFilter('ALL');
    }
  }, [reactionViewerFilter, reactionViewerUsers]);

  const canCurrentUserEditComment = (comment: Comment) => {
    const isPostOwner = normalizedCurrentUserId === normalizedPostAuthorId;
    const isCommentOwner = normalizeId(comment.author.id) === normalizedCurrentUserId;
    return !isPostOwner && isCommentOwner;
  };

  const canCurrentUserDeleteComment = (comment: Comment) => {
    const isPostOwner = normalizedCurrentUserId === normalizedPostAuthorId;
    const isCommentOwner = normalizeId(comment.author.id) === normalizedCurrentUserId;
    return isPostOwner || isCommentOwner;
  };

  const canCurrentUserReportComment = (comment: Comment) => {
    const isPostOwner = normalizedCurrentUserId === normalizedPostAuthorId;
    const isCommentOwner = normalizeId(comment.author.id) === normalizedCurrentUserId;
    return isPostOwner || !isCommentOwner;
  };

  const handleStartEditComment = (comment: Comment) => {
    setOpenMenuCommentId(null);
    setEditingCommentId(comment.id);
    setEditingDraft(comment.content);
    setError(null);
  };

  const handleSaveEditedComment = async () => {
    if (!editingCommentId || isUpdatingCommentId) {
      return;
    }

    const trimmed = editingDraft.trim();
    if (!trimmed) {
      setError('Noi dung binh luan khong duoc de trong.');
      return;
    }

    setIsUpdatingCommentId(editingCommentId);
    setError(null);

    try {
      const updatedComment = normalizeCommentTree(await commentService.updateComment(editingCommentId, trimmed));
      setComments((previous) => replaceCommentInTree(previous, updatedComment));
      setEditingCommentId(null);
      setEditingDraft('');
      onActionToast?.('Da cap nhat binh luan', 'success');
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, 'Khong the cap nhat binh luan.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsUpdatingCommentId(null);
    }
  };

  const handleOpenDeleteCommentDialog = (comment: Comment) => {
    setOpenMenuCommentId(null);
    setCommentPendingDelete(comment);
    setError(null);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentPendingDelete || isDeletingCommentId) {
      return;
    }

    const targetComment = commentPendingDelete;
    const removedCount = countCommentsInTree(targetComment);

    setIsDeletingCommentId(targetComment.id);
    setError(null);

    try {
      await commentService.deleteComment(targetComment.id);
      setComments((previous) => removeCommentFromTree(previous, targetComment.id));
      setCommentCount((previous) => Math.max(0, previous - removedCount));
      setOpenMenuCommentId(null);
      setCommentPendingDelete(null);

      if (editingCommentId === targetComment.id) {
        setEditingCommentId(null);
        setEditingDraft('');
      }

      if (replyTargetCommentId && hasCommentInTree([targetComment], replyTargetCommentId)) {
        setReplyTargetCommentId(null);
        setReplyTargetDisplayName('');
        setReplyDraft('');
      }

      onActionToast?.('Da xoa binh luan', 'error');
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Khong the xoa binh luan.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsDeletingCommentId(null);
    }
  };

  const handleOpenReportDialog = (comment: Comment) => {
    setOpenMenuCommentId(null);
    setReportingComment(comment);
    setReportReason('');
    setReportReasonError(null);
  };

  const handleConfirmReportComment = async () => {
    if (!reportingComment || isReportingComment) {
      return;
    }

    const normalizedReason = reportReason.trim();
    if (normalizedReason.length < 3) {
      setReportReasonError('Vui long nhap ly do toi thieu 3 ky tu.');
      return;
    }

    setIsReportingComment(true);
    setError(null);
    setReportReasonError(null);

    try {
      const reason = `[COMMENT:${reportingComment.id}] ${normalizedReason}`;
      await postReportService.create(postId, reason);

      setReportingComment(null);
      setReportReason('');
      onActionToast?.('Da gui bao cao binh luan cho admin', 'success');
    } catch (reportError) {
      const message = getApiErrorMessage(reportError, 'Khong the gui bao cao.');
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReportingComment(false);
    }
  };

  const getReactionFriendActionMeta = (userId: string): {
    label: string;
    disabled: boolean;
    className: string;
  } | null => {
    const state = getReactionFriendState(userId);
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

  const renderCommentItem = ({ comment, actualLevel, visualLevel }: VisibleCommentRow): JSX.Element => {
    const directReplyCount = comment.replies?.length ?? 0;
    const totalDescendantReplyCount = Math.max(0, countCommentsInTree(comment) - 1);
    const replyCount = Math.max(comment.replyCount ?? 0, directReplyCount, totalDescendantReplyCount);
    const hasReplies = replyCount > 0;
    const canToggleReplies = hasReplies && actualLevel + 1 < AUTO_EXPAND_ALL_FROM_LEVEL;
    const isReplyThreadExpanded = Boolean(expandedReplyThreadIds[comment.id]);
    const isReplyComposerOpen = replyTargetCommentId === comment.id;
    const repliedAuthor = comment.parentCommentId
      ? commentLookupById.get(comment.parentCommentId)?.author ?? null
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
                    Huy
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveEditedComment()}
                    disabled={isUpdatingCommentId === comment.id}
                    className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdatingCommentId === comment.id ? 'Dang luu...' : 'Luu'}
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
                  {REACTION_OPTIONS.map((reactionOption) => (
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
              Tra loi
            </button>

            {isCommentEdited(comment) ? <span className="text-[10px] italic text-slate-400">Da chinh sua</span> : null}

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

          {isReplyComposerOpen ? (
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
                placeholder={`Tra loi ${replyTargetDisplayName || comment.author.fullName}...`}
                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleCancelReply}
                disabled={isReplySubmittingCommentId === comment.id}
                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitReply()}
                disabled={isReplySubmittingCommentId === comment.id}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={12} />
                {isReplySubmittingCommentId === comment.id ? 'Dang gui...' : 'Gui'}
              </button>
            </div>
          ) : null}

          {canToggleReplies ? (
            <div className="mt-0 mb-2.5 pl-1">
              <button
                type="button"
                onClick={() => toggleReplyThreadVisibility(comment.id, actualLevel)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <span className="h-px w-6 bg-slate-300 dark:bg-slate-600" />
                <span>
                  {isReplyThreadExpanded
                    ? 'An phan hoi'
                    : replyCount === 1
                      ? 'Xem 1 phan hoi'
                      : `Xem them ${replyCount} phan hoi`}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <div data-comment-menu-root data-comment-id={comment.id} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpenMenuCommentId((current) => (current === comment.id ? null : comment.id))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Mo tuy chon binh luan"
          >
            <Ellipsis size={16} />
          </button>

          {openMenuCommentId === comment.id ? (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {canCurrentUserEditComment(comment) ? (
                <button
                  type="button"
                  onClick={() => handleStartEditComment(comment)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  Chinh sua
                </button>
              ) : null}

              {canCurrentUserDeleteComment(comment) ? (
                <button
                  type="button"
                  onClick={() => handleOpenDeleteCommentDialog(comment)}
                  disabled={isDeletingCommentId === comment.id}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                  {isDeletingCommentId === comment.id ? 'Dang xoa...' : 'Xoa'}
                </button>
              ) : null}

              {canCurrentUserReportComment(comment) ? (
                <button
                  type="button"
                  onClick={() => handleOpenReportDialog(comment)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-amber-600 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                >
                  <Flag size={15} />
                  Bao cao admin
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
      {isLoading ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.loading')}</p> : null}
      {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="space-y-2">{visibleCommentRows.map((row) => renderCommentItem(row))}</div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Link to="/profile" className="inline-flex shrink-0" aria-label={currentUser.fullName}>
          <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" />
        </Link>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleAddComment();
            }
          }}
          placeholder={t('post.writeComment')}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => void handleAddComment()}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send size={13} />
          {isSubmitting ? t('common.loading') : t('post.addComment')}
        </button>
      </div>

      {reactionViewerComment ? (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeReactionViewer}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
            aria-label="Dong popup reaction"
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
                aria-label="Dong popup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {isReactionViewerLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-300">
                  <Loader2 size={16} className="animate-spin" />
                  Dang tai danh sach reaction...
                </div>
              ) : null}

              {reactionViewerError ? (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                  {reactionViewerError}
                </p>
              ) : null}

              {!isReactionViewerLoading && filteredReactionViewerUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Chua co reaction nao trong nhom nay.</p>
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
      ) : null}

      {commentPendingDelete ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              if (isDeletingCommentId) {
                return;
              }

              setCommentPendingDelete(null);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="Dong popup xoa binh luan"
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                <Trash2 size={24} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xac nhan xoa binh luan</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Binh luan sau khi xoa se khong the khoi phuc.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCommentPendingDelete(null)}
                  disabled={Boolean(isDeletingCommentId)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDeleteComment()}
                  disabled={Boolean(isDeletingCommentId)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingCommentId ? 'Dang xoa...' : 'Xac nhan xoa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reportingComment ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              if (isReportingComment) {
                return;
              }

              setReportingComment(null);
              setReportReason('');
              setReportReasonError(null);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="Dong popup bao cao binh luan"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bao cao binh luan</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Noi dung se duoc gui den admin de kiem tra.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Ly do</label>
                <textarea
                  value={reportReason}
                  onChange={(event) => {
                    setReportReason(event.target.value);
                    if (reportReasonError) {
                      setReportReasonError(null);
                    }
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Nhap ly do bao cao binh luan nay..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{reportReason.length}/500</p>
                  {reportReasonError ? <p className="text-xs font-medium text-rose-600">{reportReasonError}</p> : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isReportingComment) {
                      return;
                    }

                    setReportingComment(null);
                    setReportReason('');
                    setReportReasonError(null);
                  }}
                  disabled={isReportingComment}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmReportComment()}
                  disabled={isReportingComment}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReportingComment ? 'Dang gui...' : 'Gui bao cao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};

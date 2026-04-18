import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { commentService } from '@/services/commentService';
import { friendshipService } from '@/services/friendshipService';
import { postReportService } from '@/services/postReportService';

import type { Comment, CommentReactionType, CommentReactionUser } from '@/interface/post';

import { getApiErrorMessage } from '@/utils/apiError';

import type {
  CommentSectionProps,
  ReactionFriendActionMeta,
  ReactionFriendState,
  ReactionMeta,
  ReactionViewerTabItem,
  VisibleCommentRow,
} from './interface';
import type { ReactionFilterTab } from './type';
import {
  addReplyToTree,
  AUTO_EXPAND_ALL_FROM_LEVEL,
  buildReactionFriendStateLookup,
  collectDescendantCommentIds,
  countCommentsInTree,
  DEFAULT_PAGE_SIZE,
  getReactionButtonToneClass,
  hasCommentInTree,
  isCommentEdited,
  MAX_VISUAL_REPLY_LEVEL,
  normalizeCommentTree,
  normalizeId,
  removeCommentFromTree,
  replaceCommentInTree,
  REACTION_OPTION_BASES,
} from './util';

export function useComment({
  postId,
  postAuthorId,
  initialComments,
  initialCommentCount,
  currentUser,
  onCommentCountChange,
  onActionToast,
}: CommentSectionProps) {
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

  const normalizedCurrentUserId = normalizeId(currentUser.id);
  const normalizedPostAuthorId = normalizeId(postAuthorId);
  const reactionOptions = useMemo<ReactionMeta[]>(
    () => [
      { type: 'LIKE', label: t('commentSection.reactions.like'), icon: REACTION_OPTION_BASES[0].icon },
      { type: 'WOW', label: t('commentSection.reactions.wow'), icon: REACTION_OPTION_BASES[1].icon },
      { type: 'SAD', label: t('commentSection.reactions.sad'), icon: REACTION_OPTION_BASES[2].icon },
      { type: 'ANGRY', label: t('commentSection.reactions.angry'), icon: REACTION_OPTION_BASES[3].icon },
      { type: 'HAHA', label: t('commentSection.reactions.haha'), icon: REACTION_OPTION_BASES[4].icon },
      { type: 'LOVE', label: t('commentSection.reactions.love'), icon: REACTION_OPTION_BASES[5].icon },
    ],
    [t],
  );
  const reactionMetaByType = useMemo<Record<CommentReactionType, ReactionMeta>>(
    () => ({
      LIKE: reactionOptions[0],
      WOW: reactionOptions[1],
      SAD: reactionOptions[2],
      ANGRY: reactionOptions[3],
      HAHA: reactionOptions[4],
      LOVE: reactionOptions[5],
    }),
    [reactionOptions],
  );

  const getReactionMeta = (reactionType?: CommentReactionType | null): ReactionMeta => {
    if (!reactionType) {
      return reactionMetaByType.LIKE;
    }

    return reactionMetaByType[reactionType] ?? reactionMetaByType.LIKE;
  };

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

  const toggleReplyThreadVisibility = (commentId: string, actualLevel: number) => {
    setExpandedReplyThreadIds((current) => {
      const descendants = collectDescendantCommentIds(commentId, commentLookupById);
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
      onActionToast?.(t('commentSection.replySent'), 'success');
    } catch (replyError) {
      const message = getApiErrorMessage(replyError, t('commentSection.replySendError'));
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
      const message = getApiErrorMessage(reactionError, t('commentSection.setReactionError'));
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
      const message = getApiErrorMessage(reactionError, t('commentSection.removeReactionError'));
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
      setReactionViewerError(getApiErrorMessage(reactionUsersResult.reason, t('commentSection.reactionViewerLoadError')));
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
      const message = getApiErrorMessage(actionError, t('commentSection.friendStatusUpdateError'));
      setReactionViewerError(message);
      onActionToast?.(message, 'error');
    } finally {
      setReactionFriendActionUserId(null);
    }
  };

  const reactionViewerTabs = useMemo<ReactionViewerTabItem[]>(() => {
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
        type: 'ALL',
        label: t('commentSection.reactionFilterAll'),
        count: reactionViewerUsers.length,
      },
      ...reactionOptions.filter((reaction) => countsByType[reaction.type] > 0).map((reaction) => ({
        type: reaction.type as ReactionFilterTab,
        label: reaction.icon,
        count: countsByType[reaction.type],
      })),
    ];
  }, [reactionOptions, reactionViewerUsers, t]);

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
      setError(t('commentSection.emptyCommentError'));
      return;
    }

    setIsUpdatingCommentId(editingCommentId);
    setError(null);

    try {
      const updatedComment = normalizeCommentTree(await commentService.updateComment(editingCommentId, trimmed));
      setComments((previous) => replaceCommentInTree(previous, updatedComment));
      setEditingCommentId(null);
      setEditingDraft('');
      onActionToast?.(t('commentSection.commentUpdated'), 'success');
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, t('commentSection.updateCommentError'));
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

      onActionToast?.(t('commentSection.commentDeleted'), 'error');
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, t('commentSection.deleteCommentError'));
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
      setReportReasonError(t('commentSection.reportReasonMinLength'));
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
      onActionToast?.(t('commentSection.reportSent'), 'success');
    } catch (reportError) {
      const message = getApiErrorMessage(reportError, t('commentSection.reportError'));
      setError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReportingComment(false);
    }
  };

  const getReactionFriendActionMeta = (userId: string): ReactionFriendActionMeta | null => {
    const state = getReactionFriendState(userId);
    if (state.status === 'SELF') {
      return null;
    }

    if (state.status === 'FRIEND') {
      return {
        action: 'FRIEND',
        label: t('commentSection.friendAction.friends'),
        disabled: true,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
      };
    }

    if (state.status === 'REQUEST_SENT') {
      return {
        action: 'REQUEST_SENT',
        label: t('commentSection.friendAction.cancelInvite'),
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
      };
    }

    if (state.status === 'REQUEST_RECEIVED') {
      return {
        action: 'REQUEST_RECEIVED',
        label: t('commentSection.friendAction.accept'),
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700',
      };
    }

    return {
      action: 'ADD_FRIEND',
      label: t('commentSection.friendAction.addFriend'),
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700',
    };
  };

  return {
    t,
    currentUser,
    comments,
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    replyTargetCommentId,
    replyTargetDisplayName,
    replyDraft,
    setReplyDraft,
    isReplySubmittingCommentId,
    isReactionUpdatingCommentId,
    hoveredReactionCommentId,
    setHoveredReactionCommentId,
    isUpdatingCommentId,
    isDeletingCommentId,
    openMenuCommentId,
    setOpenMenuCommentId,
    editingCommentId,
    setEditingCommentId,
    editingDraft,
    setEditingDraft,
    commentPendingDelete,
    setCommentPendingDelete,
    reportingComment,
    setReportingComment,
    reportReason,
    setReportReason,
    reportReasonError,
    setReportReasonError,
    isReportingComment,
    expandedReplyThreadIds,
    reactionViewerComment,
    reactionViewerUsers,
    reactionViewerFilter,
    setReactionViewerFilter,
    reactionViewerError,
    isReactionViewerLoading,
    isReactionFriendshipLoading,
    reactionFriendActionUserId,
    error,
    reactionOptions,
    getReactionMeta,
    getReactionButtonToneClass,
    isCommentEdited,
    commentLookupById,
    visibleCommentRows,
    reactionViewerTabs,
    filteredReactionViewerUsers,
    handleAddComment,
    handleStartReply,
    handleCancelReply,
    handleSubmitReply,
    handleSetReaction,
    handleRemoveReaction,
    handleQuickLikeComment,
    openReactionPicker,
    closeReactionPickerWithDelay,
    closeReactionViewer,
    handleOpenReactionViewer,
    handleReactionFriendAction,
    canCurrentUserEditComment,
    canCurrentUserDeleteComment,
    canCurrentUserReportComment,
    handleStartEditComment,
    handleSaveEditedComment,
    handleOpenDeleteCommentDialog,
    handleConfirmDeleteComment,
    handleOpenReportDialog,
    handleConfirmReportComment,
    getReactionFriendActionMeta,
    toggleReplyThreadVisibility,
  };
}

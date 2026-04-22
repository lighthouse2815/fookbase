import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/shared/api/error';

import { commentService } from '@/features/comment/api/service/commentService';
import { useCommentActions } from '@/features/comment/hooks/useCommentActions';
import { useCommentReactionViewer } from '@/features/comment/hooks/useCommentReactionViewer';

import type { Comment, CommentReactionType } from '@/features/comment/types/contracts';
import type {
  CommentSectionProps,
  ReactionMeta,
  VisibleCommentRow,
} from '@/features/comment/types/components';
import {
  AUTO_EXPAND_ALL_FROM_LEVEL,
  collectDescendantCommentIds,
  DEFAULT_PAGE_SIZE,
  getReactionButtonToneClass,
  isCommentEdited,
  MAX_VISUAL_REPLY_LEVEL,
  normalizeCommentTree,
  normalizeId,
  REACTION_OPTION_BASES,
} from '@/features/comment/utils/comment.util';
import {
  canDeleteComment,
  canEditComment,
  canReportComment,
} from '@/features/comment/utils/commentPermission.util';

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
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReplyThreadIds, setExpandedReplyThreadIds] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);

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

  const {
    resetInteractionState,
    ...commentActions
  } = useCommentActions({
    t,
    postId,
    setComments,
    setCommentCount,
    setError,
    setExpandedReplyThreadIds,
    onActionToast,
  });
  const { openMenuCommentId, setOpenMenuCommentId } = commentActions;

  const reactionViewer = useCommentReactionViewer({
    t,
    postId,
    normalizedCurrentUserId,
    reactionOptions,
    onActionToast,
  });

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
    resetInteractionState();
    setExpandedReplyThreadIds({});
  }, [postId, resetInteractionState]);

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
  }, [openMenuCommentId, setOpenMenuCommentId]);

  const canCurrentUserEditComment = (comment: Comment) => {
    return canEditComment(comment, {
      currentUserId: normalizedCurrentUserId,
      postAuthorId: normalizedPostAuthorId,
    });
  };

  const canCurrentUserDeleteComment = (comment: Comment) => {
    return canDeleteComment(comment, {
      currentUserId: normalizedCurrentUserId,
      postAuthorId: normalizedPostAuthorId,
    });
  };

  const canCurrentUserReportComment = (comment: Comment) => {
    return canReportComment(comment, {
      currentUserId: normalizedCurrentUserId,
      postAuthorId: normalizedPostAuthorId,
    });
  };

  return {
    t,
    currentUser,
    comments,
    isLoading,
    error,
    ...commentActions,
    expandedReplyThreadIds,
    reactionViewerComment: reactionViewer.reactionViewerComment,
    reactionViewerUsers: reactionViewer.reactionViewerUsers,
    reactionViewerFilter: reactionViewer.reactionViewerFilter,
    setReactionViewerFilter: reactionViewer.setReactionViewerFilter,
    reactionViewerError: reactionViewer.reactionViewerError,
    isReactionViewerLoading: reactionViewer.isReactionViewerLoading,
    isReactionFriendshipLoading: reactionViewer.isReactionFriendshipLoading,
    reactionFriendActionUserId: reactionViewer.reactionFriendActionUserId,
    reactionOptions,
    getReactionMeta,
    getReactionButtonToneClass,
    isCommentEdited,
    commentLookupById,
    visibleCommentRows,
    reactionViewerTabs: reactionViewer.reactionViewerTabs,
    filteredReactionViewerUsers: reactionViewer.filteredReactionViewerUsers,
    closeReactionViewer: reactionViewer.closeReactionViewer,
    handleOpenReactionViewer: reactionViewer.handleOpenReactionViewer,
    handleReactionFriendAction: reactionViewer.handleReactionFriendAction,
    canCurrentUserEditComment,
    canCurrentUserDeleteComment,
    canCurrentUserReportComment,
    getReactionFriendActionMeta: reactionViewer.getReactionFriendActionMeta,
    toggleReplyThreadVisibility,
  };
}

export type UseCommentReturn = ReturnType<typeof useComment>;

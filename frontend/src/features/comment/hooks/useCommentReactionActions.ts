import type { TFunction } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';
import { commentService } from '@/features/comment/api/service/commentService';

import type { Comment, CommentReactionType } from '@/features/comment/types/contracts';
import { replaceCommentInTree } from '@/features/comment/utils/comment.util';

interface UseCommentReactionActionsParams {
  t: TFunction;
  setComments: Dispatch<SetStateAction<Comment[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export const useCommentReactionActions = ({
  t,
  setComments,
  setError,
  onActionToast,
}: UseCommentReactionActionsParams) => {
  const [isReactionUpdatingCommentId, setIsReactionUpdatingCommentId] = useState<string | null>(null);
  const [hoveredReactionCommentId, setHoveredReactionCommentId] = useState<string | null>(null);
  const reactionHoverCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (reactionHoverCloseTimeoutRef.current) {
        window.clearTimeout(reactionHoverCloseTimeoutRef.current);
      }
    };
  }, []);

  const resetReactionState = () => {
    if (reactionHoverCloseTimeoutRef.current) {
      window.clearTimeout(reactionHoverCloseTimeoutRef.current);
      reactionHoverCloseTimeoutRef.current = null;
    }
    setHoveredReactionCommentId(null);
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

  return {
    isReactionUpdatingCommentId,
    hoveredReactionCommentId,
    setHoveredReactionCommentId,
    resetReactionState,
    handleSetReaction,
    handleRemoveReaction,
    handleQuickLikeComment,
    openReactionPicker,
    closeReactionPickerWithDelay,
  };
};

export type UseCommentReactionActionsReturn = ReturnType<typeof useCommentReactionActions>;

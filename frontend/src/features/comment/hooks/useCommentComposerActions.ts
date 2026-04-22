import type { TFunction } from 'i18next';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';
import { commentService } from '@/features/comment/api/service/commentService';

import type { Comment } from '@/features/comment/types/contracts';
import {
  addReplyToTree,
  hasCommentInTree,
  normalizeCommentTree,
} from '@/features/comment/utils/comment.util';

interface UseCommentComposerActionsParams {
  t: TFunction;
  postId: string;
  setComments: Dispatch<SetStateAction<Comment[]>>;
  setCommentCount: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setExpandedReplyThreadIds: Dispatch<SetStateAction<Record<string, true>>>;
  closeCommentMenu: () => void;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export const useCommentComposerActions = ({
  t,
  postId,
  setComments,
  setCommentCount,
  setError,
  setExpandedReplyThreadIds,
  closeCommentMenu,
  onActionToast,
}: UseCommentComposerActionsParams) => {
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTargetCommentId, setReplyTargetCommentId] = useState<string | null>(null);
  const [replyTargetDisplayName, setReplyTargetDisplayName] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [isReplySubmittingCommentId, setIsReplySubmittingCommentId] = useState<string | null>(null);

  const resetComposerState = () => {
    setReplyTargetCommentId(null);
    setReplyTargetDisplayName('');
    setReplyDraft('');
    setIsReplySubmittingCommentId(null);
  };

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
    closeCommentMenu();
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
    const targetCommentId = replyTargetCommentId;

    if (!targetCommentId || !trimmed || isReplySubmittingCommentId) {
      return;
    }

    setIsReplySubmittingCommentId(targetCommentId);
    setError(null);

    try {
      const createdReply = normalizeCommentTree(await commentService.createComment(postId, trimmed, targetCommentId));

      setComments((previous) => {
        if (!hasCommentInTree(previous, targetCommentId)) {
          return previous;
        }

        return addReplyToTree(previous, targetCommentId, createdReply);
      });
      setCommentCount((previous) => previous + 1);
      setExpandedReplyThreadIds((current) => ({
        ...current,
        [targetCommentId]: true,
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

  return {
    draft,
    setDraft,
    isSubmitting,
    replyTargetCommentId,
    setReplyTargetCommentId,
    replyTargetDisplayName,
    setReplyTargetDisplayName,
    replyDraft,
    setReplyDraft,
    isReplySubmittingCommentId,
    resetComposerState,
    handleAddComment,
    handleStartReply,
    handleCancelReply,
    handleSubmitReply,
  };
};

export type UseCommentComposerActionsReturn = ReturnType<typeof useCommentComposerActions>;

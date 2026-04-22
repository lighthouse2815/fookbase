import type { TFunction } from 'i18next';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { getApiErrorMessage } from '@/shared/api/error';

import { commentReportService } from '@/features/comment/api/service/commentReportService';
import { commentService } from '@/features/comment/api/service/commentService';

import type { Comment } from '@/features/comment/types/contracts';
import {
  countCommentsInTree,
  hasCommentInTree,
  normalizeCommentTree,
  removeCommentFromTree,
  replaceCommentInTree,
} from '@/features/comment/utils/comment.util';

interface UseCommentModerationActionsParams {
  t: TFunction;
  setComments: Dispatch<SetStateAction<Comment[]>>;
  setCommentCount: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string | null>>;
  openMenuCommentId: string | null;
  setOpenMenuCommentId: Dispatch<SetStateAction<string | null>>;
  replyTargetCommentId: string | null;
  setReplyTargetCommentId: Dispatch<SetStateAction<string | null>>;
  setReplyTargetDisplayName: Dispatch<SetStateAction<string>>;
  setReplyDraft: Dispatch<SetStateAction<string>>;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export const useCommentModerationActions = ({
  t,
  setComments,
  setCommentCount,
  setError,
  openMenuCommentId,
  setOpenMenuCommentId,
  replyTargetCommentId,
  setReplyTargetCommentId,
  setReplyTargetDisplayName,
  setReplyDraft,
  onActionToast,
}: UseCommentModerationActionsParams) => {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [isUpdatingCommentId, setIsUpdatingCommentId] = useState<string | null>(null);
  const [commentPendingDelete, setCommentPendingDelete] = useState<Comment | null>(null);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState<string | null>(null);
  const [isReportingComment, setIsReportingComment] = useState(false);

  const closeCommentMenu = () => {
    setOpenMenuCommentId(null);
  };

  const resetModerationState = () => {
    setOpenMenuCommentId(null);
    setEditingCommentId(null);
    setEditingDraft('');
    setCommentPendingDelete(null);
    setReportReason('');
    setReportReasonError(null);
    setReportingComment(null);
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
      await commentReportService.create(reportingComment.id, normalizedReason);
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

  return {
    openMenuCommentId,
    setOpenMenuCommentId,
    closeCommentMenu,
    editingCommentId,
    setEditingCommentId,
    editingDraft,
    setEditingDraft,
    isUpdatingCommentId,
    commentPendingDelete,
    setCommentPendingDelete,
    isDeletingCommentId,
    reportingComment,
    setReportingComment,
    reportReason,
    setReportReason,
    reportReasonError,
    setReportReasonError,
    isReportingComment,
    resetModerationState,
    handleStartEditComment,
    handleSaveEditedComment,
    handleOpenDeleteCommentDialog,
    handleConfirmDeleteComment,
    handleOpenReportDialog,
    handleConfirmReportComment,
  };
};

export type UseCommentModerationActionsReturn = ReturnType<typeof useCommentModerationActions>;

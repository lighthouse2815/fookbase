import type { TFunction } from 'i18next';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { Comment } from '@/features/comment/types/contracts';
import { useCommentComposerActions } from '@/features/comment/hooks/useCommentComposerActions';
import { useCommentModerationActions } from '@/features/comment/hooks/useCommentModerationActions';
import { useCommentReactionActions } from '@/features/comment/hooks/useCommentReactionActions';

interface UseCommentActionsParams {
  t: TFunction;
  postId: string;
  setComments: Dispatch<SetStateAction<Comment[]>>;
  setCommentCount: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setExpandedReplyThreadIds: Dispatch<SetStateAction<Record<string, true>>>;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

export const useCommentActions = ({
  t,
  postId,
  setComments,
  setCommentCount,
  setError,
  setExpandedReplyThreadIds,
  onActionToast,
}: UseCommentActionsParams) => {
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);

  const commentComposer = useCommentComposerActions({
    t,
    postId,
    setComments,
    setCommentCount,
    setError,
    setExpandedReplyThreadIds,
    closeCommentMenu: () => {
      setOpenMenuCommentId(null);
    },
    onActionToast,
  });

  const commentReaction = useCommentReactionActions({
    t,
    setComments,
    setError,
    onActionToast,
  });

  const commentModeration = useCommentModerationActions({
    t,
    setComments,
    setCommentCount,
    setError,
    openMenuCommentId,
    setOpenMenuCommentId,
    replyTargetCommentId: commentComposer.replyTargetCommentId,
    setReplyTargetCommentId: commentComposer.setReplyTargetCommentId,
    setReplyTargetDisplayName: commentComposer.setReplyTargetDisplayName,
    setReplyDraft: commentComposer.setReplyDraft,
    onActionToast,
  });

  const resetInteractionState = () => {
    commentComposer.resetComposerState();
    commentReaction.resetReactionState();
    commentModeration.resetModerationState();
  };

  return {
    ...commentComposer,
    ...commentReaction,
    ...commentModeration,
    resetInteractionState,
  };
};

export type UseCommentActionsReturn = ReturnType<typeof useCommentActions>;

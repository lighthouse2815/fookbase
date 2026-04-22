import type { UseCommentReturn } from '@/features/comment/hooks/useComment';
import type { VisibleCommentRow } from '@/features/comment/types/components';

export type CommentRowController = Pick<
  UseCommentReturn,
  | 't'
  | 'currentUser'
  | 'replyTargetCommentId'
  | 'replyTargetDisplayName'
  | 'replyDraft'
  | 'setReplyDraft'
  | 'isReplySubmittingCommentId'
  | 'isReactionUpdatingCommentId'
  | 'hoveredReactionCommentId'
  | 'setHoveredReactionCommentId'
  | 'isUpdatingCommentId'
  | 'isDeletingCommentId'
  | 'openMenuCommentId'
  | 'setOpenMenuCommentId'
  | 'editingCommentId'
  | 'setEditingCommentId'
  | 'editingDraft'
  | 'setEditingDraft'
  | 'expandedReplyThreadIds'
  | 'reactionOptions'
  | 'getReactionMeta'
  | 'getReactionButtonToneClass'
  | 'isCommentEdited'
  | 'commentLookupById'
  | 'handleStartReply'
  | 'handleCancelReply'
  | 'handleSubmitReply'
  | 'handleSetReaction'
  | 'handleQuickLikeComment'
  | 'openReactionPicker'
  | 'closeReactionPickerWithDelay'
  | 'handleOpenReactionViewer'
  | 'canCurrentUserEditComment'
  | 'canCurrentUserDeleteComment'
  | 'canCurrentUserReportComment'
  | 'handleStartEditComment'
  | 'handleSaveEditedComment'
  | 'handleOpenDeleteCommentDialog'
  | 'handleOpenReportDialog'
  | 'toggleReplyThreadVisibility'
>;

export interface CommentRowProps {
  row: VisibleCommentRow;
  controller: CommentRowController;
}

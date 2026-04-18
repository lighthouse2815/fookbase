import { Ellipsis, Flag, Loader2, Pencil, Send, Trash2, UserCheck, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatRelativeTime } from '@/utils/date';

import type { CommentSectionProps, VisibleCommentRow } from './interface';
import {
  AUTO_EXPAND_ALL_FROM_LEVEL,
  countCommentsInTree,
  REPLY_INDENT_PER_LEVEL_PX,
} from './util';
import { useComment } from './useComment';

export const CommentSection = (props: CommentSectionProps) => {
  const {
    t,
    currentUser,
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
  } = useComment(props);

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
                    {t('commentSection.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveEditedComment()}
                    disabled={isUpdatingCommentId === comment.id}
                    className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdatingCommentId === comment.id ? t('commentSection.saving') : t('commentSection.save')}
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
                  {reactionOptions.map((reactionOption) => (
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
              {t('commentSection.reply')}
            </button>

            {isCommentEdited(comment) ? <span className="text-[10px] italic text-slate-400">{t('commentSection.edited')}</span> : null}

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
                placeholder={t('commentSection.replyPlaceholder', {
                  name: replyTargetDisplayName || comment.author.fullName,
                })}
                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleCancelReply}
                disabled={isReplySubmittingCommentId === comment.id}
                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('commentSection.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitReply()}
                disabled={isReplySubmittingCommentId === comment.id}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={12} />
                {isReplySubmittingCommentId === comment.id ? t('commentSection.sending') : t('commentSection.send')}
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
                    ? t('commentSection.hideReplies')
                    : replyCount === 1
                      ? t('commentSection.viewOneReply')
                      : t('commentSection.viewMoreReplies', { count: replyCount })}
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
            aria-label={t('commentSection.commentMenuAria')}
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
                  {t('commentSection.edit')}
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
                  {isDeletingCommentId === comment.id ? t('commentSection.deleting') : t('commentSection.delete')}
                </button>
              ) : null}

              {canCurrentUserReportComment(comment) ? (
                <button
                  type="button"
                  onClick={() => handleOpenReportDialog(comment)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-amber-600 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                >
                  <Flag size={15} />
                  {t('commentSection.reportToAdmin')}
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
            aria-label={t('commentSection.reactionModalOverlayAria')}
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
                aria-label={t('commentSection.reactionModalCloseButtonAria')}
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {isReactionViewerLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-300">
                  <Loader2 size={16} className="animate-spin" />
                  {t('commentSection.reactionModalLoading')}
                </div>
              ) : null}

              {reactionViewerError ? (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                  {reactionViewerError}
                </p>
              ) : null}

              {!isReactionViewerLoading && filteredReactionViewerUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">{t('commentSection.reactionModalEmpty')}</p>
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
                            {!isFriendActionLoading && friendActionMeta.action === 'ADD_FRIEND' ? <UserPlus size={13} /> : null}
                            {!isFriendActionLoading && friendActionMeta.action === 'FRIEND' ? <UserCheck size={13} /> : null}
                            <span>{isFriendActionLoading ? t('commentSection.processing') : friendActionMeta.label}</span>
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
            aria-label={t('commentSection.deleteModalOverlayAria')}
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                <Trash2 size={24} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('commentSection.deleteModalTitle')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t('commentSection.deleteModalDescription')}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCommentPendingDelete(null)}
                  disabled={Boolean(isDeletingCommentId)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  {t('commentSection.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDeleteComment()}
                  disabled={Boolean(isDeletingCommentId)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingCommentId ? t('commentSection.deleting') : t('commentSection.confirmDelete')}
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
            aria-label={t('commentSection.reportModalOverlayAria')}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('commentSection.reportModalTitle')}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t('commentSection.reportModalDescription')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t('commentSection.reportReasonLabel')}</label>
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
                  placeholder={t('commentSection.reportReasonPlaceholder')}
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
                  {t('commentSection.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmReportComment()}
                  disabled={isReportingComment}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReportingComment ? t('commentSection.sending') : t('commentSection.sendReport')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};

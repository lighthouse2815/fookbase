import { useCallback, useEffect, useState, type SetStateAction, type WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { CommentSection } from '@/features/comment/components/CommentSection';
import { usePostCard } from '@/features/post/hooks/usePostCard';
import type { PostCardProps } from '@/features/post/types/components';
import { detectMediaKind } from '@/features/post/utils/media';
import { PostCardContent } from '@/features/post/components/PostCardContent';
import { PostCardEngagementActions } from '@/features/post/components/PostCardEngagementActions';
import { PostCardHeader } from '@/features/post/components/PostCardHeader';
import { PostDeleteDialog } from '@/features/post/components/PostDeleteDialog';
import { PostMediaViewer } from '@/features/post/components/PostMediaViewer';
import { PostReactionViewerModal } from '@/features/post/components/PostReactionViewerModal';
import { PostReportDialog } from '@/features/post/components/PostReportDialog';

const DEFAULT_IMAGE_VIEWER_SCALE = 1.12;
const MIN_IMAGE_VIEWER_SCALE = 0.7;
const MAX_IMAGE_VIEWER_SCALE = 4;
const IMAGE_VIEWER_SCALE_STEP = 0.12;

export const PostCard = ({
  post,
  currentUser,
  enableMediaViewer = false,
  showEngagementActions = true,
  showPostMenu = true,
  onActionToast,
  onPostDeleted,
}: PostCardProps) => {
  const { t } = useTranslation();
  const mediaUrls = post.imageUrls ?? [];
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [mediaViewerCursor, setMediaViewerCursor] = useState<{ postId: string; index: number }>({
    postId: post.id,
    index: 0,
  });
  const [imageViewerScale, setImageViewerScale] = useState(DEFAULT_IMAGE_VIEWER_SCALE);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const activeMediaIndex = mediaViewerCursor.postId === post.id ? mediaViewerCursor.index : 0;
  const activeMediaUrl = mediaUrls[activeMediaIndex] ?? mediaUrls[0];
  const activeMediaKind = detectMediaKind(activeMediaUrl);

  const setActiveMediaIndex = useCallback((nextIndex: SetStateAction<number>) => {
    setMediaViewerCursor((previousCursor) => {
      const previousIndex = previousCursor.postId === post.id ? previousCursor.index : 0;
      const resolvedIndex = typeof nextIndex === 'function'
        ? (nextIndex as (value: number) => number)(previousIndex)
        : nextIndex;

      return {
        postId: post.id,
        index: resolvedIndex,
      };
    });
    setImageViewerScale(DEFAULT_IMAGE_VIEWER_SCALE);
  }, [post.id]);

  const {
    authorProfilePath,
    isPostOwner,
    reactionCount,
    currentUserReactionType,
    topReactionTypes,
    isReactionUpdating,
    isReactionPickerOpen,
    setIsReactionPickerOpen,
    isReactionViewerOpen,
    setIsReactionViewerOpen,
    reactionViewerFilter,
    likeError,
    commentCount,
    setCommentCount,
    isCommentsOpen,
    setIsCommentsOpen,
    isPostMenuOpen,
    setIsPostMenuOpen,
    isReportDialogOpen,
    setIsReportDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isSavingPost,
    isReportingPost,
    isDeletingPost,
    reportReason,
    setReportReason,
    reportReasonError,
    setReportReasonError,
    postActionError,
    postMenuRef,
    commentSectionRef,
    getReactionMeta,
    reactionOptions,
    handleSetReaction,
    handleQuickLikePost,
    openReactionPicker,
    closeReactionPickerWithDelay,
    handleOpenComments,
    handleOpenReactionViewer,
    handleSavePost,
    handleConfirmReportPost,
    handleDeletePost,
  } = usePostCard({ post, currentUser, onActionToast, onPostDeleted });

  useEffect(() => {
    if (!isMediaViewerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMediaViewerOpen(false);
        return;
      }

      if (mediaUrls.length <= 1) {
        return;
      }

      if (event.key === 'ArrowRight') {
        setActiveMediaIndex((previous) => (previous + 1) % mediaUrls.length);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setActiveMediaIndex((previous) => (previous - 1 + mediaUrls.length) % mediaUrls.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMediaViewerOpen, mediaUrls.length, setActiveMediaIndex]);

  const handleImageViewerWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!isMediaViewerOpen || activeMediaKind !== 'image') {
      return;
    }

    event.preventDefault();

    setImageViewerScale((previousScale) => {
      const nextScale = event.deltaY < 0
        ? previousScale + IMAGE_VIEWER_SCALE_STEP
        : previousScale - IMAGE_VIEWER_SCALE_STEP;
      return Math.min(MAX_IMAGE_VIEWER_SCALE, Math.max(MIN_IMAGE_VIEWER_SCALE, nextScale));
    });
  };

  const openMediaAt = (index: number) => {
    setActiveMediaIndex(index);
    setIsMediaViewerOpen(true);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 sm:p-4">
      <PostCardHeader
        post={post}
        authorProfilePath={authorProfilePath}
        showPostMenu={showPostMenu}
        postMenuRef={postMenuRef}
        isPostMenuOpen={isPostMenuOpen}
        setIsPostMenuOpen={setIsPostMenuOpen}
        isSavingPost={isSavingPost}
        handleSavePost={handleSavePost}
        isPostOwner={isPostOwner}
        setReportReason={setReportReason}
        setReportReasonError={setReportReasonError}
        setIsReportDialogOpen={setIsReportDialogOpen}
        isReportingPost={isReportingPost}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isDeletingPost={isDeletingPost}
      />

      <PostCardContent
        t={t}
        post={post}
        mediaUrls={mediaUrls}
        enableMediaViewer={enableMediaViewer}
        isContentExpanded={isContentExpanded}
        setIsContentExpanded={setIsContentExpanded}
        onOpenMediaAt={openMediaAt}
      />

      {showEngagementActions ? (
        <PostCardEngagementActions
          t={t}
          postId={post.id}
          reactionCount={reactionCount}
          topReactionTypes={topReactionTypes}
          getReactionMeta={getReactionMeta}
          onOpenReactionViewer={handleOpenReactionViewer}
          commentCount={commentCount}
          onOpenComments={handleOpenComments}
          isReactionUpdating={isReactionUpdating}
          currentUserReactionType={currentUserReactionType}
          onQuickLikePost={handleQuickLikePost}
          isReactionPickerOpen={isReactionPickerOpen}
          openReactionPicker={openReactionPicker}
          closeReactionPickerWithDelay={closeReactionPickerWithDelay}
          reactionOptions={reactionOptions}
          setIsReactionPickerOpen={setIsReactionPickerOpen}
          onSetReaction={handleSetReaction}
          isCommentsOpen={isCommentsOpen}
          onToggleComments={() => setIsCommentsOpen((previous) => !previous)}
        />
      ) : null}

      {showEngagementActions && likeError ? <p className="mb-2 text-xs text-rose-600 dark:text-rose-400">{likeError}</p> : null}
      {(showEngagementActions || showPostMenu) && postActionError ? (
        <p className="mb-2 text-xs text-rose-600 dark:text-rose-400">{postActionError}</p>
      ) : null}

      {showEngagementActions && isCommentsOpen ? (
        <div ref={commentSectionRef}>
          <CommentSection
            postId={post.id}
            postAuthorId={post.author.id}
            initialComments={post.comments}
            initialCommentCount={post.commentCount}
            currentUser={currentUser}
            onCommentCountChange={(count) => setCommentCount(count)}
            onActionToast={onActionToast}
          />
        </div>
      ) : null}

      {showEngagementActions ? (
        <PostReactionViewerModal
          postId={post.id}
          isOpen={isReactionViewerOpen}
          initialFilter={reactionViewerFilter}
          currentUserId={currentUser.id}
          onClose={() => setIsReactionViewerOpen(false)}
          onActionToast={onActionToast}
        />
      ) : null}

      {showPostMenu ? (
        <PostReportDialog
          isOpen={isReportDialogOpen}
          isReportingPost={isReportingPost}
          reportReason={reportReason}
          setReportReason={setReportReason}
          reportReasonError={reportReasonError}
          setReportReasonError={setReportReasonError}
          onClose={() => {
            setIsReportDialogOpen(false);
            setReportReason('');
            setReportReasonError(null);
          }}
          onConfirm={handleConfirmReportPost}
        />
      ) : null}

      {showPostMenu ? (
        <PostDeleteDialog
          isOpen={isDeleteDialogOpen}
          isDeletingPost={isDeletingPost}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirmDelete={handleDeletePost}
        />
      ) : null}

      <PostMediaViewer
        isOpen={isMediaViewerOpen}
        activeMediaUrl={activeMediaUrl ?? null}
        activeMediaKind={activeMediaKind}
        authorName={post.author.fullName}
        mediaUrls={mediaUrls}
        activeMediaIndex={activeMediaIndex}
        imageViewerScale={imageViewerScale}
        onClose={() => setIsMediaViewerOpen(false)}
        onPrev={() =>
          setActiveMediaIndex((previous) => (previous - 1 + mediaUrls.length) % mediaUrls.length)
        }
        onNext={() =>
          setActiveMediaIndex((previous) => (previous + 1) % mediaUrls.length)
        }
        onWheel={handleImageViewerWheel}
      />
    </article>
  );
};

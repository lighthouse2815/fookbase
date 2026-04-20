import { AlertTriangle, BookmarkPlus, ChevronLeft, ChevronRight, Ellipsis, Flag, MessageCircle, Share2, ThumbsUp, Trash2, X } from 'lucide-react';
import { useEffect, useState, type WheelEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CommentSection } from '@/components/comment/CommentSection';
import { formatRelativeTime } from '@/utils/date';
import { detectMediaKind } from '@/utils/media';

import { usePostCard } from './hooks/usePostCard';
import type { PostCardProps } from './interface';
import { PostReactionViewerModal } from './PostReactionViewerModal';
import { getReactionButtonToneClass } from './util';

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
  const mediaKind = detectMediaKind(mediaUrls[0]);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [imageViewerScale, setImageViewerScale] = useState(DEFAULT_IMAGE_VIEWER_SCALE);
  const activeMediaUrl = mediaUrls[activeMediaIndex] ?? mediaUrls[0];
  const activeMediaKind = detectMediaKind(activeMediaUrl);

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
  }, [isMediaViewerOpen, mediaUrls.length]);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [post.id]);

  useEffect(() => {
    if (!isMediaViewerOpen || activeMediaKind !== 'image') {
      return;
    }

    setImageViewerScale(DEFAULT_IMAGE_VIEWER_SCALE);
  }, [isMediaViewerOpen, activeMediaKind, activeMediaUrl]);

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

  const allMediaAreImages = mediaUrls.length > 0 && mediaUrls.every((mediaUrl) => detectMediaKind(mediaUrl) === 'image');
  const hiddenMediaCount = mediaUrls.length > 4 ? mediaUrls.length - 4 : 0;

  const openMediaAt = (index: number) => {
    setActiveMediaIndex(index);
    setIsMediaViewerOpen(true);
  };

  const renderMediaTile = (index: number, className: string, overlayCount = 0) => {
    const mediaUrl = mediaUrls[index];
    if (!mediaUrl) {
      return null;
    }

    const itemKind = detectMediaKind(mediaUrl);
    const mediaElement = itemKind === 'video' ? (
      <video src={mediaUrl} controls={!enableMediaViewer} className={`${className} min-h-0 bg-black object-cover`} />
    ) : (
      <img
        src={mediaUrl}
        alt={`${post.author.fullName}-${index + 1}`}
        className={`${className} min-h-0 bg-slate-100 object-cover dark:bg-slate-900`}
      />
    );

    const overlayElement = overlayCount > 0 ? (
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-bold text-white">
        +{overlayCount}
      </div>
    ) : null;

    if (enableMediaViewer) {
      return (
        <button
          type="button"
          onClick={() => openMediaAt(index)}
          className="relative block h-full min-h-0 w-full overflow-hidden rounded-xl cursor-zoom-in"
          aria-label={itemKind === 'video' ? 'Xem video bai post o che do lon' : 'Xem anh bai post o che do lon'}
        >
          {mediaElement}
          {overlayElement}
        </button>
      );
    }

    return (
      <div className="relative h-full min-h-0 w-full overflow-hidden rounded-xl">
        {mediaElement}
        {overlayElement}
      </div>
    );
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 sm:p-4">
      <header className="flex items-start gap-2.5 sm:gap-3">
        <Link to={authorProfilePath} aria-label={post.author.fullName} className="inline-flex">
          <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
        </Link>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author.fullName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(post.createdAt)}</p>
        </div>

        {showPostMenu ? (
          <div ref={postMenuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setIsPostMenuOpen((current) => !current)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:h-9 sm:w-9"
              aria-label="Mo tuy chon bai viet"
            >
              <Ellipsis size={20} />
            </button>

            {isPostMenuOpen ? (
              <div className="absolute right-0 top-10 z-20 w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => void handleSavePost()}
                  disabled={isSavingPost}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <BookmarkPlus size={16} />
                  {isSavingPost ? 'Dang luu bai viet...' : 'Luu bai viet'}
                </button>
                {!isPostOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPostMenuOpen(false);
                      setReportReason('');
                      setReportReasonError(null);
                      setIsReportDialogOpen(true);
                    }}
                    disabled={isReportingPost}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <Flag size={16} />
                    Bao cao
                  </button>
                ) : null}
                {isPostOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPostMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={isDeletingPost}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={16} />
                    {isDeletingPost ? 'Dang xoa bai viet...' : 'Xoa bai viet'}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {post.content ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          {post.content}
        </p>
      ) : null}

      {mediaUrls.length === 1 && mediaKind === 'video' ? (
        enableMediaViewer ? (
          <button
            type="button"
            onClick={() => openMediaAt(0)}
            className="mt-3 block w-full cursor-zoom-in rounded-xl"
            aria-label="Xem video bai post o che do lon"
          >
            <video src={mediaUrls[0]} className="max-h-[560px] w-full rounded-xl bg-black" />
          </button>
        ) : (
          <video src={mediaUrls[0]} controls className="mt-3 max-h-[560px] w-full rounded-xl bg-black" />
        )
      ) : mediaUrls.length === 1 && allMediaAreImages ? (
        enableMediaViewer ? (
          <button
            type="button"
            onClick={() => openMediaAt(0)}
            className="mt-3 block w-full cursor-zoom-in rounded-xl"
            aria-label="Xem anh bai post o che do lon"
          >
            <img
              src={mediaUrls[0]}
              alt={post.author.fullName}
              className="max-h-[560px] w-full rounded-xl bg-slate-100 object-contain dark:bg-slate-900"
            />
          </button>
        ) : (
          <img
            src={mediaUrls[0]}
            alt={post.author.fullName}
            className="mt-3 max-h-[560px] w-full rounded-xl bg-slate-100 object-contain dark:bg-slate-900"
          />
        )
      ) : allMediaAreImages && mediaUrls.length === 2 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {renderMediaTile(0, 'h-44 w-full sm:h-64')}
          {renderMediaTile(1, 'h-44 w-full sm:h-64')}
        </div>
      ) : allMediaAreImages && mediaUrls.length === 3 ? (
        <div className="mt-3 grid h-[260px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:h-[420px] lg:h-[460px]">
          {renderMediaTile(0, 'h-full w-full')}
          <div className="grid h-full min-h-0 grid-rows-[repeat(2,minmax(0,1fr))] gap-2">
            {renderMediaTile(1, 'h-full w-full')}
            {renderMediaTile(2, 'h-full w-full')}
          </div>
        </div>
      ) : allMediaAreImages && mediaUrls.length >= 4 ? (
        <div className="mt-3 grid h-[260px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:h-[420px] lg:h-[460px]">
          {renderMediaTile(0, 'h-full w-full')}
          <div className="grid h-full min-h-0 grid-rows-[repeat(3,minmax(0,1fr))] gap-2">
            {renderMediaTile(1, 'h-full w-full')}
            {renderMediaTile(2, 'h-full w-full')}
            {renderMediaTile(3, 'h-full w-full', hiddenMediaCount)}
          </div>
        </div>
      ) : mediaUrls.length > 1 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {mediaUrls.map((_, index) => (
            <div key={`${post.id}-media-fallback-${index}`}>
              {renderMediaTile(index, 'h-56 w-full')}
            </div>
          ))}
        </div>
      ) : null}

      {showEngagementActions ? (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            {reactionCount > 0 ? (
              <div className="inline-flex items-center gap-1.5">
                <div className="inline-flex items-center">
                  {topReactionTypes.slice(0, 3).map((reactionType, index) => (
                    <button
                      key={`${post.id}-top-reaction-${reactionType}-${index}`}
                      type="button"
                      onClick={() => handleOpenReactionViewer(reactionType)}
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
                  onClick={() => handleOpenReactionViewer('ALL')}
                  className="font-semibold transition hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {reactionCount}
                </button>
              </div>
            ) : (
              <span>0</span>
            )}

            <button
              type="button"
              onClick={handleOpenComments}
              className="font-semibold transition hover:text-slate-700 dark:hover:text-slate-200"
            >
              {t('post.commentCountLabel', { count: commentCount })}
            </button>
          </div>

          <div className="my-3 grid grid-cols-3 gap-1.5 border-y border-slate-100 py-2 dark:border-slate-700 sm:gap-2">
            <div className="relative" onMouseEnter={openReactionPicker} onMouseLeave={closeReactionPickerWithDelay}>
              <button
                type="button"
                onClick={() => void handleQuickLikePost()}
                disabled={isReactionUpdating}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm ${getReactionButtonToneClass(currentUserReactionType)}`}
              >
                {currentUserReactionType ? <span>{getReactionMeta(currentUserReactionType).icon}</span> : <ThumbsUp size={16} />}
                <span>{currentUserReactionType ? getReactionMeta(currentUserReactionType).label : t('post.like')}</span>
              </button>

              {isReactionPickerOpen ? (
                <div
                  className="absolute bottom-full left-0 z-20 mb-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                  onMouseEnter={openReactionPicker}
                  onMouseLeave={closeReactionPickerWithDelay}
                >
                  {reactionOptions.map((reactionOption) => (
                    <button
                      key={`${post.id}-reaction-option-${reactionOption.type}`}
                      type="button"
                      onClick={() => {
                        setIsReactionPickerOpen(false);
                        void handleSetReaction(reactionOption.type);
                      }}
                      disabled={isReactionUpdating}
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
              onClick={() => setIsCommentsOpen((previous) => !previous)}
              className={`inline-flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium transition sm:text-sm ${
                isCommentsOpen
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <MessageCircle size={16} />
              {t('post.comment')}
            </button>
            <button className="inline-flex items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 sm:text-sm">
              <Share2 size={16} />
              {t('post.share')}
            </button>
          </div>
        </>
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

      {showPostMenu && isReportDialogOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setIsReportDialogOpen(false);
              setReportReason('');
              setReportReasonError(null);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="Dong popup bao cao"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xac nhan bao cao bai viet</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Ban muon bao cao bai viet nay cho admin?
                </p>
                <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">Ly do bao cao</label>
                <textarea
                  value={reportReason}
                  onChange={(event) => {
                    setReportReason(event.target.value);
                    if (reportReasonError) {
                      setReportReasonError(null);
                    }
                  }}
                  maxLength={500}
                  rows={4}
                  placeholder="Nhap ly do bao cao bai viet nay..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-rose-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{reportReason.length}/500</p>
                  {reportReasonError ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{reportReasonError}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportDialogOpen(false);
                    setReportReason('');
                    setReportReasonError(null);
                  }}
                  disabled={isReportingPost}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmReportPost()}
                  disabled={isReportingPost}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isReportingPost ? 'Dang gui...' : 'Xac nhan bao cao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPostMenu && isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              if (isDeletingPost) {
                return;
              }

              setIsDeleteDialogOpen(false);
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="Dong popup xoa bai viet"
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                <Trash2 size={24} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xac nhan xoa bai viet</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Bai viet sau khi xoa se khong the khoi phuc.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeletingPost}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePost()}
                  disabled={isDeletingPost}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isDeletingPost ? 'Dang xoa...' : 'Xac nhan xoa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isMediaViewerOpen && activeMediaUrl ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsMediaViewerOpen(false)}
            className="absolute inset-0 bg-black/85"
            aria-label="Dong xem media lon"
          />

          <div className="relative max-h-[90vh] w-full max-w-5xl" onWheel={handleImageViewerWheel}>
            {activeMediaKind === 'video' ? (
              <video
                src={activeMediaUrl}
                controls
                autoPlay
                className="max-h-[90vh] w-full rounded-2xl border border-white/15 bg-black/60 object-contain shadow-2xl"
              />
            ) : (
              <img
                src={activeMediaUrl}
                alt={post.author.fullName}
                className="max-h-[90vh] w-full rounded-2xl border border-white/15 bg-black/40 object-contain shadow-2xl transition-transform duration-100 ease-out"
                style={{ transform: `scale(${imageViewerScale})` }}
              />
            )}

            {mediaUrls.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveMediaIndex((previous) => (previous - 1 + mediaUrls.length) % mediaUrls.length)
                  }
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="Anh truoc"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveMediaIndex((previous) => (previous + 1) % mediaUrls.length)
                  }
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="Anh tiep theo"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                  {activeMediaIndex + 1}/{mediaUrls.length}
                </div>
              </>
            ) : null}

            {activeMediaKind === 'image' ? (
              <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                {Math.round(imageViewerScale * 100)}%
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsMediaViewerOpen(false)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Dong"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};

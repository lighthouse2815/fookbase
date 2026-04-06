import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookmarkPlus, Ellipsis, Flag, MessageCircle, Share2, ThumbsUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { postReportService } from '../services/postReportService';
import { postService } from '../services/postService';
import { savedPostService } from '../services/savedPostService';
import type { Post, PostReactionType } from '../types/post';
import type { User } from '../types/user';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';
import { detectMediaKind } from '../utils/media';
import { CommentSection } from './CommentSection';
import { PostReactionViewerModal } from './PostReactionViewerModal';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
  onPostDeleted?: (postId: string) => void;
}

interface ReactionMeta {
  type: PostReactionType;
  label: string;
  icon: string;
}

const REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', label: 'Thich', icon: '👍' },
  { type: 'WOW', label: 'Wow', icon: '😮' },
  { type: 'SAD', label: 'Sad', icon: '😢' },
  { type: 'ANGRY', label: 'Gian', icon: '😡' },
  { type: 'HAHA', label: 'Haha', icon: '😂' },
  { type: 'LOVE', label: 'Tim', icon: '❤️' },
];

const REACTION_META_BY_TYPE = REACTION_OPTIONS.reduce<Record<PostReactionType, ReactionMeta>>(
  (accumulator, item) => {
    accumulator[item.type] = item;
    return accumulator;
  },
  {
    LIKE: REACTION_OPTIONS[0],
    WOW: REACTION_OPTIONS[1],
    SAD: REACTION_OPTIONS[2],
    ANGRY: REACTION_OPTIONS[3],
    HAHA: REACTION_OPTIONS[4],
    LOVE: REACTION_OPTIONS[5],
  },
);

type ReactionFilterTab = 'ALL' | PostReactionType;

export const PostCard = ({ post, currentUser, onActionToast, onPostDeleted }: PostCardProps) => {
  const { t } = useTranslation();
  const authorProfilePath = `/profile/${post.author.id}`;
  const mediaKind = detectMediaKind(post.imageUrl);
  const isPostOwner = currentUser.id.trim().toLowerCase() === post.author.id.trim().toLowerCase();
  const [reactionCount, setReactionCount] = useState(post.reactionCount ?? post.likes);
  const [currentUserReactionType, setCurrentUserReactionType] = useState<PostReactionType | null>(
    post.currentUserReactionType ?? (post.likedByCurrentUser ? 'LIKE' : null),
  );
  const [topReactionTypes, setTopReactionTypes] = useState<PostReactionType[]>(post.topReactionTypes ?? []);
  const [isReactionUpdating, setIsReactionUpdating] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isReactionViewerOpen, setIsReactionViewerOpen] = useState(false);
  const [reactionViewerFilter, setReactionViewerFilter] = useState<ReactionFilterTab>('ALL');
  const [likeError, setLikeError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? post.comments.length);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const commentSectionRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setReactionCount(post.reactionCount ?? post.likes);
    setCurrentUserReactionType(post.currentUserReactionType ?? (post.likedByCurrentUser ? 'LIKE' : null));
    setTopReactionTypes(post.topReactionTypes ?? []);
    setCommentCount(post.commentCount ?? post.comments.length);
    setIsCommentsOpen(false);
    setIsPostMenuOpen(false);
    setIsReportDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setReportReason('');
    setReportReasonError(null);
    setLikeError(null);
    setPostActionError(null);
    setIsDeletingPost(false);
    setIsReactionPickerOpen(false);
    setIsReactionViewerOpen(false);
    setReactionViewerFilter('ALL');
  }, [
    post.commentCount,
    post.comments.length,
    post.currentUserReactionType,
    post.id,
    post.likedByCurrentUser,
    post.likes,
    post.reactionCount,
    post.topReactionTypes,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!postMenuRef.current) {
        return;
      }

      const targetNode = event.target as Node | null;
      if (targetNode && !postMenuRef.current.contains(targetNode)) {
        setIsPostMenuOpen(false);
      }
    };

    if (isPostMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPostMenuOpen]);

  useEffect(() => {
    if (!isCommentsOpen) {
      return;
    }

    commentSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [isCommentsOpen]);

  useEffect(() => {
    return () => {
      if (reactionPickerCloseTimeoutRef.current) {
        window.clearTimeout(reactionPickerCloseTimeoutRef.current);
      }
    };
  }, []);

  const getReactionMeta = (reactionType?: PostReactionType | null): ReactionMeta => {
    if (!reactionType) {
      return REACTION_META_BY_TYPE.LIKE;
    }

    return REACTION_META_BY_TYPE[reactionType] ?? REACTION_META_BY_TYPE.LIKE;
  };

  const getReactionButtonToneClass = (reactionType?: PostReactionType | null) => {
    if (!reactionType) {
      return 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700';
    }

    if (reactionType === 'LIKE') {
      return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/40';
    }

    if (reactionType === 'ANGRY' || reactionType === 'LOVE') {
      return 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/40';
    }

    return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/40';
  };

  const handleSetReaction = async (reactionType: PostReactionType) => {
    if (isReactionUpdating) {
      return;
    }

    setIsReactionUpdating(true);
    setLikeError(null);

    try {
      const state = await postService.setReaction(post.id, reactionType);
      setCurrentUserReactionType(state.reactionType);
      setReactionCount(state.reactionCount);
      setTopReactionTypes(state.topReactionTypes);
    } catch (error) {
      setLikeError(getApiErrorMessage(error, 'Unable to update reaction.'));
    } finally {
      setIsReactionUpdating(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (isReactionUpdating) {
      return;
    }

    setIsReactionUpdating(true);
    setLikeError(null);

    try {
      const state = await postService.removeReaction(post.id);
      setCurrentUserReactionType(state.reactionType);
      setReactionCount(state.reactionCount);
      setTopReactionTypes(state.topReactionTypes);
    } catch (error) {
      setLikeError(getApiErrorMessage(error, 'Unable to update reaction.'));
    } finally {
      setIsReactionUpdating(false);
    }
  };

  const handleQuickLikePost = async () => {
    setIsReactionPickerOpen(false);
    if (currentUserReactionType) {
      await handleRemoveReaction();
      return;
    }

    await handleSetReaction('LIKE');
  };

  const openReactionPicker = () => {
    if (reactionPickerCloseTimeoutRef.current) {
      window.clearTimeout(reactionPickerCloseTimeoutRef.current);
      reactionPickerCloseTimeoutRef.current = null;
    }

    setIsReactionPickerOpen(true);
  };

  const closeReactionPickerWithDelay = () => {
    if (reactionPickerCloseTimeoutRef.current) {
      window.clearTimeout(reactionPickerCloseTimeoutRef.current);
    }

    reactionPickerCloseTimeoutRef.current = window.setTimeout(() => {
      setIsReactionPickerOpen(false);
      reactionPickerCloseTimeoutRef.current = null;
    }, 150);
  };

  const handleOpenComments = () => {
    setIsCommentsOpen((previous) => !previous);
  };

  const handleOpenReactionViewer = (filter: ReactionFilterTab) => {
    if (reactionCount === 0) {
      return;
    }

    setReactionViewerFilter(filter);
    setIsReactionViewerOpen(true);
  };

  const handleSavePost = async () => {
    if (isSavingPost) {
      return;
    }

    setIsSavingPost(true);
    setPostActionError(null);

    try {
      await savedPostService.savePost(post.id);
      setIsPostMenuOpen(false);
      onActionToast?.('Da luu bai viet', 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Khong the luu bai viet.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleConfirmReportPost = async () => {
    if (isReportingPost) {
      return;
    }

    setIsReportingPost(true);
    setPostActionError(null);
    setReportReasonError(null);

    const normalizedReason = reportReason.trim();
    if (normalizedReason.length < 3) {
      setReportReasonError('Vui long nhap ly do toi thieu 3 ky tu.');
      setIsReportingPost(false);
      return;
    }

    try {
      await postReportService.create(post.id, normalizedReason);
      setIsReportDialogOpen(false);
      setReportReason('');
      onActionToast?.('Ban da to cao bai viet thanh cong', 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Khong the bao cao bai viet.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReportingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isPostOwner || isDeletingPost) {
      return;
    }

    setIsDeletingPost(true);
    setPostActionError(null);

    try {
      await postService.deletePost(post.id);
      setIsDeleteDialogOpen(false);
      setIsPostMenuOpen(false);
      onActionToast?.('Da xoa bai viet', 'success');
      onPostDeleted?.(post.id);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Khong the xoa bai viet.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsDeletingPost(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <header className="flex items-start gap-3">
        <Link to={authorProfilePath} aria-label={post.author.fullName} className="inline-flex">
          <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-11 w-11 rounded-full" />
        </Link>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author.fullName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(post.createdAt)}</p>
        </div>

        <div ref={postMenuRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setIsPostMenuOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Mo tuy chon bai viet"
          >
            <Ellipsis size={20} />
          </button>

          {isPostMenuOpen ? (
            <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => void handleSavePost()}
                disabled={isSavingPost}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <BookmarkPlus size={16} />
                {isSavingPost ? 'Dang luu bai viet...' : 'Luu bai viet'}
              </button>
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
      </header>

      {post.content ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          {post.content}
        </p>
      ) : null}

      {post.imageUrl && mediaKind === 'video' ? (
        <video src={post.imageUrl} controls className="mt-3 max-h-[560px] w-full rounded-xl bg-black" />
      ) : post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt={post.author.fullName}
          className="mt-3 max-h-[560px] w-full rounded-xl bg-slate-100 object-contain dark:bg-slate-900"
        />
      ) : null}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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

      <div className="my-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-2 dark:border-slate-700">
        <div
          className="relative"
          onMouseEnter={openReactionPicker}
          onMouseLeave={closeReactionPickerWithDelay}
        >
          <button
            type="button"
            onClick={() => void handleQuickLikePost()}
            disabled={isReactionUpdating}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${getReactionButtonToneClass(currentUserReactionType)}`}
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
              {REACTION_OPTIONS.map((reactionOption) => (
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
          className={`inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium transition ${
            isCommentsOpen
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <MessageCircle size={16} />
          {t('post.comment')}
        </button>
        <button className="inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
          <Share2 size={16} />
          {t('post.share')}
        </button>
      </div>

      {likeError ? <p className="mb-2 text-xs text-rose-600 dark:text-rose-400">{likeError}</p> : null}
      {postActionError ? <p className="mb-2 text-xs text-rose-600 dark:text-rose-400">{postActionError}</p> : null}

      {isCommentsOpen ? (
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

      <PostReactionViewerModal
        postId={post.id}
        isOpen={isReactionViewerOpen}
        initialFilter={reactionViewerFilter}
        currentUserId={currentUser.id}
        onClose={() => setIsReactionViewerOpen(false)}
        onActionToast={onActionToast}
      />

      {isReportDialogOpen ? (
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
                <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Ly do bao cao
                </label>
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

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportDialogOpen(false);
                    setReportReason('');
                    setReportReasonError(null);
                  }}
                  disabled={isReportingPost}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmReportPost()}
                  disabled={isReportingPost}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isReportingPost ? 'Dang gui...' : 'Xac nhan bao cao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteDialogOpen ? (
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

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeletingPost}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  Huy
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeletePost()}
                  disabled={isDeletingPost}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingPost ? 'Dang xoa...' : 'Xac nhan xoa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};


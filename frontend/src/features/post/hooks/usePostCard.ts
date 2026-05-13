import { useCallback, useEffect, useRef, useState } from 'react';

import { postReportService } from '@/features/post/api/service/postReportService';
import { postService } from '@/features/post/api/service/postService';
import { savedPostService } from '@/features/post/api/service/savedPostService';
import type { PostReactionType } from '@/features/post/types/contracts';
import type { PostCardProps, ReactionFilterTab } from '@/features/post/types/components';
import { getApiErrorMessage } from '@/shared/api/error';

import { getReactionMeta, POST_REACTION_OPTIONS } from '@/features/post/utils/reaction';

type UsePostCardParams = PostCardProps;

export const usePostCard = ({ post, currentUser, onActionToast, onPostDeleted }: UsePostCardParams) => {
  const authorProfilePath = `/profile/${post.author.id}`;
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
  const [shareCount, setShareCount] = useState(post.shareCount ?? 0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isSharingPost, setIsSharingPost] = useState(false);
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
    setShareCount(post.shareCount ?? 0);
    setIsCommentsOpen(false);
    setIsPostMenuOpen(false);
    setIsReportDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setReportReason('');
    setReportReasonError(null);
    setLikeError(null);
    setPostActionError(null);
    setIsDeletingPost(false);
    setIsSharingPost(false);
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
    post.shareCount,
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

  const handleSetReaction = useCallback(
    async (reactionType: PostReactionType) => {
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
    },
    [isReactionUpdating, post.id],
  );

  const handleRemoveReaction = useCallback(async () => {
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
  }, [isReactionUpdating, post.id]);

  const handleQuickLikePost = useCallback(async () => {
    setIsReactionPickerOpen(false);
    if (currentUserReactionType) {
      await handleRemoveReaction();
      return;
    }

    await handleSetReaction('LIKE');
  }, [currentUserReactionType, handleRemoveReaction, handleSetReaction]);

  const openReactionPicker = useCallback(() => {
    if (reactionPickerCloseTimeoutRef.current) {
      window.clearTimeout(reactionPickerCloseTimeoutRef.current);
      reactionPickerCloseTimeoutRef.current = null;
    }

    setIsReactionPickerOpen(true);
  }, []);

  const closeReactionPickerWithDelay = useCallback(() => {
    if (reactionPickerCloseTimeoutRef.current) {
      window.clearTimeout(reactionPickerCloseTimeoutRef.current);
    }

    reactionPickerCloseTimeoutRef.current = window.setTimeout(() => {
      setIsReactionPickerOpen(false);
      reactionPickerCloseTimeoutRef.current = null;
    }, 150);
  }, []);

  const handleOpenComments = useCallback(() => {
    setIsCommentsOpen((previous) => !previous);
  }, []);

  const handleOpenReactionViewer = useCallback(
    (filter: ReactionFilterTab) => {
      if (reactionCount === 0) {
        return;
      }

      setReactionViewerFilter(filter);
      setIsReactionViewerOpen(true);
    },
    [reactionCount],
  );

  const handleSavePost = useCallback(async () => {
    if (isSavingPost) {
      return;
    }

    setIsSavingPost(true);
    setPostActionError(null);

    try {
      await savedPostService.savePost(post.id);
      setIsPostMenuOpen(false);
      onActionToast?.('Đã lưu bài viết', 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể lưu bài viết.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsSavingPost(false);
    }
  }, [isSavingPost, onActionToast, post.id]);

  const handleConfirmReportPost = useCallback(async () => {
    if (isReportingPost) {
      return;
    }

    setIsReportingPost(true);
    setPostActionError(null);
    setReportReasonError(null);

    const normalizedReason = reportReason.trim();
    if (normalizedReason.length < 3) {
      setReportReasonError('Vui lòng nhập lý do tối thiểu 3 ký tự.');
      setIsReportingPost(false);
      return;
    }

    try {
      await postReportService.create(post.id, normalizedReason);
      setIsReportDialogOpen(false);
      setReportReason('');
      onActionToast?.('Bạn đã tố cáo bài viết thành công', 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể báo cáo bài viết.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsReportingPost(false);
    }
  }, [isReportingPost, onActionToast, post.id, reportReason]);

  const handleDeletePost = useCallback(async () => {
    if (!isPostOwner || isDeletingPost) {
      return;
    }

    setIsDeletingPost(true);
    setPostActionError(null);

    try {
      await postService.deletePost(post.id);
      setIsDeleteDialogOpen(false);
      setIsPostMenuOpen(false);
      onActionToast?.('Đã xóa bài viết', 'success');
      onPostDeleted?.(post.id);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể xóa bài viết.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsDeletingPost(false);
    }
  }, [isDeletingPost, isPostOwner, onActionToast, onPostDeleted, post.id]);

  const handleSharePost = useCallback(async () => {
    if (isSharingPost) {
      return;
    }

    setIsSharingPost(true);
    setPostActionError(null);

    try {
      await postService.sharePost(post.id, {});
      setShareCount((previous) => previous + 1);
      onActionToast?.('Đã chia sẻ bài viết', 'success');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể chia sẻ bài viết.');
      setPostActionError(message);
      onActionToast?.(message, 'error');
    } finally {
      setIsSharingPost(false);
    }
  }, [isSharingPost, onActionToast, post.id]);

  return {
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
    shareCount,
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
    isSharingPost,
    reportReason,
    setReportReason,
    reportReasonError,
    setReportReasonError,
    postActionError,
    postMenuRef,
    commentSectionRef,
    getReactionMeta,
    reactionOptions: POST_REACTION_OPTIONS,
    handleSetReaction,
    handleRemoveReaction,
    handleQuickLikePost,
    openReactionPicker,
    closeReactionPickerWithDelay,
    handleOpenComments,
    handleOpenReactionViewer,
    handleSavePost,
    handleConfirmReportPost,
    handleDeletePost,
    handleSharePost,
  };
};

export type UsePostCardReturn = ReturnType<typeof usePostCard>;

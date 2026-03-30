import { useEffect, useState } from 'react';
import { MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { postService } from '../services/postService';
import type { Post } from '../types/post';
import type { User } from '../types/user';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';
import { detectMediaKind } from '../utils/media';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  currentUser: User;
}

export const PostCard = ({ post, currentUser }: PostCardProps) => {
  const { t } = useTranslation();
  const authorProfilePath = `/profile/${post.author.id}`;
  const mediaKind = detectMediaKind(post.imageUrl);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(Boolean(post.likedByCurrentUser));
  const [isLikeUpdating, setIsLikeUpdating] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? post.comments.length);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useEffect(() => {
    setLikeCount(post.likes);
    setIsLiked(Boolean(post.likedByCurrentUser));
    setCommentCount(post.commentCount ?? post.comments.length);
    setIsCommentsOpen(false);
    setLikeError(null);
  }, [post.commentCount, post.comments.length, post.id, post.likedByCurrentUser, post.likes]);

  const handleToggleLike = async () => {
    if (isLikeUpdating) {
      return;
    }

    setIsLikeUpdating(true);
    setLikeError(null);

    try {
      const state = isLiked ? await postService.unlikePost(post.id) : await postService.likePost(post.id);
      setLikeCount(state.likeCount);
      setIsLiked(state.liked);
    } catch (error) {
      setLikeError(getApiErrorMessage(error, 'Unable to update like.'));
    } finally {
      setIsLikeUpdating(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <header className="flex items-center gap-3">
        <Link to={authorProfilePath} aria-label={post.author.fullName} className="inline-flex">
          <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-11 w-11 rounded-full" />
        </Link>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author.fullName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(post.createdAt)}</p>
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
        <span>{likeCount}</span>
        <span>{commentCount}</span>
      </div>

      <div className="my-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-2 dark:border-slate-700">
        <button
          type="button"
          onClick={() => void handleToggleLike()}
          disabled={isLikeUpdating}
          className={`inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium transition ${
            isLiked
              ? 'bg-brand-100 font-bold text-brand-700 ring-1 ring-brand-300 dark:bg-brand-500/20 dark:text-brand-300 dark:ring-brand-400/50'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <ThumbsUp size={16} />
          {t('post.like')}
        </button>
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

      {isCommentsOpen ? (
        <CommentSection
          postId={post.id}
          initialComments={post.comments}
          initialCommentCount={post.commentCount}
          currentUser={currentUser}
          onCommentCountChange={(count) => setCommentCount(count)}
        />
      ) : null}
    </article>
  );
};


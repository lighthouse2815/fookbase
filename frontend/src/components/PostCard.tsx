import { MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Post } from '../types/post';
import type { User } from '../types/user';
import { formatRelativeTime } from '../utils/date';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  currentUser: User;
}

export const PostCard = ({ post, currentUser }: PostCardProps) => {
  const { t } = useTranslation();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <header className="flex items-center gap-3">
        <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-11 w-11 rounded-full" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author.fullName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </header>

      <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{post.content}</p>

      {post.imageUrl ? (
        <img src={post.imageUrl} alt={post.author.fullName} className="mt-3 w-full rounded-xl object-cover" />
      ) : null}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{post.likes}</span>
        <span>{post.comments.length}</span>
      </div>

      <div className="my-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-2 dark:border-slate-700">
        <button className="inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
          <ThumbsUp size={16} />
          {t('post.like')}
        </button>
        <button className="inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
          <MessageCircle size={16} />
          {t('post.comment')}
        </button>
        <button className="inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
          <Share2 size={16} />
          {t('post.share')}
        </button>
      </div>

      <CommentSection initialComments={post.comments} currentUser={currentUser} />
    </article>
  );
};


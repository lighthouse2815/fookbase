import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { commentService } from '../services/commentService';
import type { Comment } from '../types/post';
import type { User } from '../types/user';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  initialCommentCount?: number;
  currentUser: User;
  onCommentCountChange?: (count: number) => void;
}

const DEFAULT_PAGE_SIZE = 20;

export const CommentSection = ({
  postId,
  initialComments,
  initialCommentCount,
  currentUser,
  onCommentCountChange,
}: CommentSectionProps) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentCount, setCommentCount] = useState(initialCommentCount ?? initialComments.length);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await commentService.getCommentsByPostId(postId, 1, DEFAULT_PAGE_SIZE);

        if (!isActive) {
          return;
        }

        setComments(response.items);
        setCommentCount(response.totalCount);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(getApiErrorMessage(loadError, 'Unable to load comments.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isActive = false;
    };
  }, [postId]);

  useEffect(() => {
    onCommentCountChange?.(commentCount);
  }, [commentCount, onCommentCountChange]);

  const handleAddComment = async () => {
    const trimmed = draft.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdComment = await commentService.createComment(postId, trimmed);

      setComments((previous) => [...previous, createdComment]);
      setCommentCount((previous) => previous + 1);
      setDraft('');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to send comment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
      {isLoading ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.loading')}</p> : null}
      {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-700/40">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{comment.author.fullName}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
            <p className="mt-1 text-[11px] text-slate-400">{formatRelativeTime(comment.createdAt)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" />
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
    </div>
  );
};


import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { UseCommentReturn } from '@/features/comment/hooks/useComment';

type CommentComposerProps = Pick<
  UseCommentReturn,
  't' | 'currentUser' | 'draft' | 'setDraft' | 'isSubmitting' | 'handleAddComment'
>;

export const CommentComposer = ({
  t,
  currentUser,
  draft,
  setDraft,
  isSubmitting,
  handleAddComment,
}: CommentComposerProps) => {
  return (
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
  );
};

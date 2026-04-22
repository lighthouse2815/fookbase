import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { FriendSuggestion } from '@/features/friendship/types/contracts';

interface FriendCardProps {
  suggestion: FriendSuggestion;
  onAddFriend?: (id: string) => void;
}

export const FriendCard = ({ suggestion, onAddFriend }: FriendCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${suggestion.id}`} className="inline-flex" aria-label={suggestion.fullName}>
          <img
            src={suggestion.avatarUrl}
            alt={suggestion.fullName}
            className="h-11 w-11 rounded-full object-cover"
          />
        </Link>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{suggestion.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('sidebar.mutualFriends', { count: suggestion.mutualFriends })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAddFriend?.(suggestion.id)}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-200 dark:bg-brand-500/20 dark:text-brand-300"
      >
        <UserPlus size={14} />
        {t('sidebar.addFriend')}
      </button>
    </div>
  );
};


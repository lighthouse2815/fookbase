import { UserCard } from '@/features/friendship/components/UserCard';
import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipSuggestionsSectionProps = Pick<
  UseFriendsPageReturn,
  't' | 'suggestions' | 'selectedUserId' | 'handleSelectUser' | 'handleAddFriend'
>;

export const FriendshipSuggestionsSection = ({
  t,
  suggestions,
  selectedUserId,
  handleSelectUser,
  handleAddFriend,
}: FriendshipSuggestionsSectionProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.suggestionTitle')}</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.peopleCount', { count: suggestions.length })}</span>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.suggestions')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <UserCard
              key={suggestion.id}
              user={suggestion}
              variant="grid"
              selected={selectedUserId === suggestion.id}
              onSelect={() => handleSelectUser(suggestion.id)}
              primaryActionLabel={t('friendsPage.actions.addFriend')}
              onPrimaryAction={() => void handleAddFriend(suggestion.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

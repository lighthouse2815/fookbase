import { FriendRequestCard } from '@/features/friendship/components/FriendRequestCard';
import { UserCard } from '@/features/friendship/components/UserCard';
import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipHomeSectionProps = Pick<
  UseFriendsPageReturn,
  | 't'
  | 'receivedRequests'
  | 'sentRequests'
  | 'suggestions'
  | 'selectedUserId'
  | 'handleSelectUser'
  | 'handleConfirmRequest'
  | 'handleDeleteReceivedRequest'
  | 'handleCancelSentRequest'
  | 'handleAddFriend'
>;

export const FriendshipHomeSection = ({
  t,
  receivedRequests,
  sentRequests,
  suggestions,
  selectedUserId,
  handleSelectUser,
  handleConfirmRequest,
  handleDeleteReceivedRequest,
  handleCancelSentRequest,
  handleAddFriend,
}: FriendshipHomeSectionProps) => {
  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.receivedRequestsTitle')}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('friendsPage.receivedRequestCount', { count: receivedRequests.length })}
          </span>
        </div>

        {receivedRequests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.receivedRequests')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {receivedRequests.map((request) => (
              <FriendRequestCard
                key={request.requestId}
                request={request}
                mode="received"
                selected={selectedUserId === request.id}
                onSelect={() => handleSelectUser(request.id)}
                onConfirm={() => void handleConfirmRequest(request.requestId)}
                onDelete={() => void handleDeleteReceivedRequest(request.requestId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.sentRequestsTitle')}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('friendsPage.sentRequestCount', { count: sentRequests.length })}
          </span>
        </div>

        {sentRequests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.sentRequestsRecent')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sentRequests.map((request) => (
              <FriendRequestCard
                key={request.requestId}
                request={request}
                mode="sent"
                selected={selectedUserId === request.id}
                onSelect={() => handleSelectUser(request.id)}
                onCancel={() => void handleCancelSentRequest(request.requestId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.suggestionTitle')}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('friendsPage.suggestionCount', { count: suggestions.length })}
          </span>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.suggestionsTemporary')}</p>
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
    </>
  );
};

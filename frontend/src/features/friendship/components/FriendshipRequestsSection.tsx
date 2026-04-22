import { FriendRequestCard } from '@/features/friendship/components/FriendRequestCard';
import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipRequestsSectionProps = Pick<
  UseFriendsPageReturn,
  | 't'
  | 'receivedRequests'
  | 'sentRequests'
  | 'selectedUserId'
  | 'handleSelectUser'
  | 'handleConfirmRequest'
  | 'handleDeleteReceivedRequest'
  | 'handleCancelSentRequest'
>;

export const FriendshipRequestsSection = ({
  t,
  receivedRequests,
  sentRequests,
  selectedUserId,
  handleSelectUser,
  handleConfirmRequest,
  handleDeleteReceivedRequest,
  handleCancelSentRequest,
}: FriendshipRequestsSectionProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.requestsTitle')}</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('friendsPage.itemsCount', { count: receivedRequests.length + sentRequests.length })}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.receivedRequestsTitle')}</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('friendsPage.receivedRequestCount', { count: receivedRequests.length })}
            </span>
          </div>

          {receivedRequests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('friendsPage.empty.receivedRequestsPending')}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
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
        </div>

        <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.sentRequestsTitle')}</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('friendsPage.sentRequestCount', { count: sentRequests.length })}
            </span>
          </div>

          {sentRequests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.sentRequests')}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
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
        </div>
      </div>
    </section>
  );
};

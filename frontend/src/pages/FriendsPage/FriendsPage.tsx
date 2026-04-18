import clsx from 'clsx';
import {
  AlertTriangle,
  Filter,
  Menu,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react';

import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { FriendsPageSkeleton } from '@/components/friends/FriendsPageSkeleton';
import { ProfilePreview } from '@/components/friends/ProfilePreview';
import { SidebarItem } from '@/components/friends/SidebarItem';
import { UserCard } from '@/components/friends/UserCard';

import { useFriendsPage } from './hooks/useFriendsPage';
import type { ProfileRelation } from './type';

export const FriendsPage = () => {
  const {
    t,
    activeTab,
    fetchState,
    selectedUserId,
    setSelectedUserId,
    isSidebarOpen,
    setIsSidebarOpen,
    errorMessage,
    receivedRequests,
    sentRequests,
    suggestions,
    friends,
    friendSearch,
    setFriendSearch,
    friendFilter,
    setFriendFilter,
    confirmUnfriendUser,
    isUnfriendSubmitting,
    sidebarTabs,
    friendFilters,
    loadFriendData,
    handleChangeTab,
    selectedProfile,
    filteredFriends,
    handleConfirmRequest,
    handleDeleteReceivedRequest,
    handleCancelSentRequest,
    handleAddFriend,
    handleMessageUser,
    requestUnfriend,
    closeUnfriendDialog,
    handleConfirmUnfriend,
    tabTitle,
    selectedSuggestion,
    selectedReceivedRequest,
    selectedSentRequest,
    selectedFriend,
  } = useFriendsPage();

  if (fetchState === 'loading') {
    return <FriendsPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.managementTitle')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tabTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadFriendData()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <RefreshCcw size={15} />
              {t('friendsPage.refresh')}
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300 xl:hidden"
              aria-label={t('friendsPage.openMenuAria')}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {errorMessage}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/50 xl:hidden"
            aria-label={t('friendsPage.closeMenuAria')}
          />
        ) : null}

        <aside
          className={clsx(
            'z-30 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/85',
            'xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:translate-x-0',
            'fixed left-3 top-20 h-[calc(100vh-6rem)] w-[260px] xl:static xl:w-auto',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] xl:translate-x-0',
          )}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.menuTitle')}</h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            {sidebarTabs.map((tab) => {
              const count =
                tab.id === 'requests'
                  ? receivedRequests.length
                  : tab.id === 'suggestions'
                    ? suggestions.length
                    : tab.id === 'friends'
                      ? friends.length
                      : undefined;

              return (
                <SidebarItem
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  active={activeTab === tab.id}
                  count={count}
                  onClick={() => {
                    handleChangeTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                />
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          {activeTab === 'home' ? (
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
                        onSelect={() => setSelectedUserId(request.id)}
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
                        onSelect={() => setSelectedUserId(request.id)}
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
                        onSelect={() => setSelectedUserId(suggestion.id)}
                        primaryActionLabel={t('friendsPage.actions.addFriend')}
                        onPrimaryAction={() => void handleAddFriend(suggestion.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}

          {activeTab === 'requests' ? (
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
                          onSelect={() => setSelectedUserId(request.id)}
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
                          onSelect={() => setSelectedUserId(request.id)}
                          onCancel={() => void handleCancelSentRequest(request.requestId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'suggestions' ? (
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
                      onSelect={() => setSelectedUserId(suggestion.id)}
                      primaryActionLabel={t('friendsPage.actions.addFriend')}
                      onPrimaryAction={() => void handleAddFriend(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'friends' ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.friendsTitle')}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.resultCount', { count: filteredFriends.length })}</span>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={friendSearch}
                    onChange={(event) => setFriendSearch(event.target.value)}
                    placeholder={t('friendsPage.searchPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>

                <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <Filter size={14} className="ml-2 shrink-0 text-slate-400" />
                  {friendFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFriendFilter(filter.id)}
                      className={clsx(
                        'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                        friendFilter === filter.id
                          ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
// unfriend button
              {filteredFriends.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.friendsFiltered')}</p>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <UserCard
                      key={friend.id}
                      user={friend}
                      variant="list"
                      selected={selectedUserId === friend.id}
                      onSelect={() => setSelectedUserId(friend.id)}
                      statusText={friend.isOnline ? t('friendsPage.status.online') : t('friendsPage.status.offline')}
                      primaryActionLabel={t('friendsPage.actions.message')}
                      onPrimaryAction={() => handleMessageUser(friend.id)}
                      secondaryActionLabel={t('friendsPage.actions.unfriend')}
                      onSecondaryAction={() => requestUnfriend(friend.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </main>
// addFriend
        <div className="xl:sticky xl:top-20 xl:h-fit">
          <ProfilePreview
            user={selectedProfile?.user ?? null}
            relation={(selectedProfile?.relation ?? null) as ProfileRelation}
            onAddFriend={
              selectedSuggestion
                ? () => {
                    void handleAddFriend(selectedSuggestion.id);
                  }
                : undefined
            }
            onConfirmRequest={
              selectedReceivedRequest
                ? () => {
                    void handleConfirmRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onDeleteRequest={
              selectedReceivedRequest
                ? () => {
                    void handleDeleteReceivedRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onCancelRequest={
              selectedSentRequest
                ? () => {
                    void handleCancelSentRequest(selectedSentRequest.requestId);
                  }
                : undefined
            }
            onUnfriend={
              selectedFriend
                ? () => {
                    requestUnfriend(selectedFriend.id);
                  }
                : undefined
            }
            onMessage={
              selectedFriend
                ? () => {
                    handleMessageUser(selectedFriend.id);
                  }
                : undefined
            }
          />
        </div>
      </div>

      {confirmUnfriendUser ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeUnfriendDialog}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label={t('friendsPage.closeUnfriendDialogAria')}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.unfriendDialog.title')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t('friendsPage.unfriendDialog.descriptionPrefix')}{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{confirmUnfriendUser.fullName}</span>
                  ? {t('friendsPage.unfriendDialog.descriptionSuffix')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeUnfriendDialog}
                  disabled={isUnfriendSubmitting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  {t('friendsPage.actions.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmUnfriend()}
                  disabled={isUnfriendSubmitting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUnfriendSubmitting ? t('friendsPage.actions.processing') : t('friendsPage.actions.unfriend')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

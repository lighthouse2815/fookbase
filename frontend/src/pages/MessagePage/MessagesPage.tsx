import clsx from 'clsx';
import { ChevronLeft, Plus, Search, Send, UsersRound } from 'lucide-react';

import { formatRelativeTime } from '@/utils/date';

import { useMessagesPage } from './hooks/useMessagesPage';

export const MessagesPage = () => {
  const {
    t,
    currentUser,
    fetchState,
    activeTab,
    setActiveTab,
    searchValue,
    setSearchValue,
    errorMessage,
    chatTabs,
    filteredConversations,
    isMobileViewport,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
    selectedMessages,
    loadingConversationId,
    messageError,
    composerValue,
    setComposerValue,
    isSending,
    isRealtimeConnected,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    groupName,
    setGroupName,
    selectedMemberIds,
    groupError,
    isCreatingGroup,
    friendCandidates,
    messagesViewportRef,
    handleSendMessage,
    closeGroupDialog,
    handleToggleMember,
    handleCreateGroup,
    tabCount,
  } = useMessagesPage();
  const showConversationList = !isMobileViewport || !selectedConversation;
  const showConversationDetail = !isMobileViewport || Boolean(selectedConversation);

  if (fetchState === 'loading') {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:rounded-3xl">
        <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 lg:min-h-[75vh] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={clsx(
              'border-slate-200 dark:border-slate-700 lg:border-b-0 lg:border-r',
              showConversationList ? 'flex flex-col border-b' : 'hidden lg:flex lg:flex-col',
            )}
          >
            <div className="space-y-3 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('messagesPage.title')}</h1>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus size={14} />
                  {t('messagesPage.createGroup')}
                </button>
              </div>

              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={t('messagesPage.searchPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                {chatTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      activeTab === tab.id
                        ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                        : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100',
                    )}
                  >
                    {tab.label}
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {tabCount(tab.id)}
                    </span>
                  </button>
                ))}
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                  {errorMessage}
                </p>
              ) : null}
            </div>
            <div className="max-h-[calc(100vh-20rem)] space-y-1 overflow-y-auto px-2 pb-3 lg:max-h-[calc(75vh-9.75rem)]">
              {filteredConversations.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('messagesPage.empty')}
                </p>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.conversationId)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition',
                      selectedConversationId === conversation.conversationId
                        ? 'bg-brand-100/80 dark:bg-brand-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80',
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conversation.displayAvatar}
                        alt={conversation.name}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      {conversation.type === 'PRIVATE' && conversation.isOnline ? (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {conversation.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                          {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {conversation.lastMessagePreview || t('messagesPage.noMessagesYet')}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>

          <div
            className={clsx(
              'min-h-[calc(100vh-10rem)] flex-col lg:min-h-[75vh]',
              showConversationDetail ? 'flex' : 'hidden lg:flex',
            )}
          >
            {selectedConversation ? (
              <>
                <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  {isMobileViewport ? (
                    <button
                      type="button"
                      onClick={() => setSelectedConversationId(null)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label={t('common.back', { defaultValue: 'Back' })}
                    >
                      <ChevronLeft size={18} />
                    </button>
                  ) : null}

                  <div className="relative">
                    <img
                      src={selectedConversation.displayAvatar}
                      alt={selectedConversation.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    {selectedConversation.type === 'PRIVATE' && selectedConversation.isOnline ? (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedConversation.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedConversation.type === 'GROUP'
                        ? t('messagesPage.groupMembers', { count: selectedConversation.memberCount })
                        : selectedConversation.isOnline
                          ? t('messagesPage.onlineNow')
                          : t('messagesPage.offline')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {selectedConversation.type === 'GROUP' ? (
                        <UsersRound size={12} />
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                      {selectedConversation.type === 'GROUP'
                        ? t('messagesPage.tabs.groups')
                        : t('messagesPage.tabs.friends')}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold',
                        isRealtimeConnected
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                      )}
                    >
                      {isRealtimeConnected ? t('messagesPage.realtime.connected') : t('messagesPage.realtime.fallback')}
                    </span>
                  </div>
                </header>

                <div
                  ref={messagesViewportRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3 sm:p-4 dark:bg-slate-900/40"
                >
                  {loadingConversationId === selectedConversation.conversationId ? (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
                  ) : null}

                  {messageError ? (
                    <p className="rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                      {messageError}
                    </p>
                  ) : null}

                  {selectedMessages.length === 0 && loadingConversationId !== selectedConversation.conversationId ? (
                    <p className="pt-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t('messagesPage.noMessagesYet')}
                    </p>
                  ) : (
                    selectedMessages.map((message) => {
                      const isMine = message.senderId === currentUser.id;

                      return (
                        <div
                          key={message.messageId}
                          className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div className={clsx('max-w-[88%] sm:max-w-[80%]', isMine ? 'items-end' : 'items-start')}>
                            {!isMine && selectedConversation.type === 'GROUP' ? (
                              <p className="mb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {message.senderName}
                              </p>
                            ) : null}

                            <div
                              className={clsx(
                                'rounded-2xl px-3 py-2 text-sm',
                                isMine
                                  ? 'rounded-br-md bg-brand-600 text-white'
                                  : 'rounded-bl-md bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100',
                              )}
                            >
                              {message.content || t('messagesPage.attachmentOnly')}
                            </div>

                            <p
                              className={clsx(
                                'mt-1 text-[11px] text-slate-500 dark:text-slate-400',
                                isMine ? 'text-right' : 'text-left',
                              )}
                            >
                              {formatRelativeTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSendMessage();
                  }}
                  className="border-t border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-end gap-2">
                    <input
                      value={composerValue}
                      onChange={(event) => setComposerValue(event.target.value)}
                      placeholder={t('messagesPage.composerPlaceholder')}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={composerValue.trim().length === 0 || isSending}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full min-h-[75vh] items-center justify-center p-6 text-center">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t('messagesPage.placeholderTitle')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('messagesPage.placeholderDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeGroupDialog}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label={t('messagesPage.closeCreateGroup')}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-cyan-500" />

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t('messagesPage.createGroupDialog.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.description')}
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.groupNameLabel')}
                </span>
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={t('messagesPage.createGroupDialog.groupNamePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.membersLabel')}
                </p>

                {friendCandidates.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                    {t('messagesPage.createGroupDialog.noFriends')}
                  </p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                    {friendCandidates.map((friend) => {
                      const isSelected = selectedMemberIds.includes(friend.id);

                      return (
                        <label
                          key={friend.id}
                          className={clsx(
                            'flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition',
                            isSelected
                              ? 'bg-brand-100/70 dark:bg-brand-500/20'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMember(friend.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <div className="relative">
                            <img src={friend.avatarUrl} alt={friend.fullName} className="h-10 w-10 rounded-full object-cover" />
                            {friend.isOnline ? (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {friend.fullName}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{friend.username}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {groupError ? (
                <p className="rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
                  {groupError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeGroupDialog}
                  disabled={isCreatingGroup}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateGroup()}
                  disabled={isCreatingGroup}
                  className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isCreatingGroup ? t('messagesPage.creatingGroup') : t('messagesPage.createGroup')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

import clsx from 'clsx';
import { Plus, Search } from 'lucide-react';

import { formatRelativeTime } from '@/shared/lib/date';
import type { MessagesSidebarProps } from '@/features/message/types/components';

export const MessagesSidebar = ({
  t,
  showConversationList,
  activeTab,
  setActiveTab,
  searchValue,
  setSearchValue,
  errorMessage,
  chatTabs,
  tabCount,
  filteredConversations,
  selectedConversationId,
  setSelectedConversationId,
  onOpenCreateGroup,
}: MessagesSidebarProps) => {
  return (
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
            onClick={onOpenCreateGroup}
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

      <div className="max-h-[calc(100dvh-20rem)] space-y-1 overflow-y-auto px-2 pb-3 lg:max-h-[calc(75vh-9.75rem)]">
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
  );
};

import clsx from 'clsx';
import { ChevronLeft, Send, UsersRound } from 'lucide-react';

import type { MessagesConversationDetailProps } from '@/features/message/types/components';
import { buildFallbackAvatar, toComparableTimestamp } from '@/features/message/utils/page.util';

const CONTINUOUS_MESSAGE_GAP_MS = 60 * 1000;

const isSameCalendarDay = (firstTime: number, secondTime: number): boolean => {
  if (firstTime <= 0 || secondTime <= 0) {
    return false;
  }

  const firstDate = new Date(firstTime);
  const secondDate = new Date(secondTime);

  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
};

const formatMessageTime = (timestamp: number): string => {
  if (timestamp <= 0) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
};

const formatMessageDate = (timestamp: number): string => {
  if (timestamp <= 0) {
    return '--/--/----';
  }

  const date = new Date(timestamp);
  const day = date.getDate();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const MessagesConversationDetail = ({
  t,
  showConversationDetail,
  selectedConversation,
  selectedMessages,
  loadingConversationId,
  messageError,
  currentUserId,
  currentUserAvatarUrl,
  knownUsers,
  composerValue,
  setComposerValue,
  isSending,
  isRealtimeConnected,
  isMobileViewport,
  messagesViewportRef,
  onBack,
  onSendMessage,
}: MessagesConversationDetailProps) => {
  const knownUserAvatarById = new Map(knownUsers.map((user) => [user.id, user.avatarUrl]));

  const resolveSenderAvatar = (senderId: string) => {
    if (senderId === currentUserId) {
      return currentUserAvatarUrl || buildFallbackAvatar(senderId);
    }

    if (knownUserAvatarById.has(senderId)) {
      return knownUserAvatarById.get(senderId) || buildFallbackAvatar(senderId);
    }

    if (selectedConversation?.type === 'PRIVATE') {
      return selectedConversation.displayAvatar || buildFallbackAvatar(senderId);
    }

    return buildFallbackAvatar(senderId);
  };

  return (
    <div
      className={clsx(
        'flex h-full min-h-0 flex-col',
        showConversationDetail ? 'flex' : 'hidden lg:flex',
      )}
    >
      {selectedConversation ? (
        <>
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            {isMobileViewport ? (
              <button
                type="button"
                onClick={onBack}
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
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3 sm:p-4 dark:bg-slate-900/40"
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
              selectedMessages.map((message, index) => {
                const isMine = message.senderId === currentUserId;
                const messageTime = toComparableTimestamp(message.createdAt);
                const previousMessage = index > 0 ? selectedMessages[index - 1] : undefined;
                const nextMessage = index < selectedMessages.length - 1 ? selectedMessages[index + 1] : undefined;

                const previousTime = previousMessage ? toComparableTimestamp(previousMessage.createdAt) : 0;
                const nextTime = nextMessage ? toComparableTimestamp(nextMessage.createdAt) : 0;
                const sameSenderAsPrevious = Boolean(previousMessage && previousMessage.senderId === message.senderId);
                const sameSenderAsNext = Boolean(nextMessage && nextMessage.senderId === message.senderId);
                const gapWithPrevious = previousMessage ? messageTime - previousTime : Number.POSITIVE_INFINITY;
                const gapWithNext = nextMessage ? nextTime - messageTime : Number.POSITIVE_INFINITY;

                const isConsecutiveWithPrevious = sameSenderAsPrevious && gapWithPrevious >= 0 && gapWithPrevious <= CONTINUOUS_MESSAGE_GAP_MS;
                const isConsecutiveWithNext = sameSenderAsNext && gapWithNext >= 0 && gapWithNext <= CONTINUOUS_MESSAGE_GAP_MS;
                const shouldShowAvatar = !isConsecutiveWithPrevious;
                const shouldShowTime = !isConsecutiveWithNext;
                const shouldShowSenderName = selectedConversation.type === 'GROUP' && !isMine && shouldShowAvatar;
                const shouldShowDateDivider = !previousMessage || !isSameCalendarDay(previousTime, messageTime);
                const senderAvatar = resolveSenderAvatar(message.senderId);

                return (
                  <div key={message.messageId} className="space-y-1.5">
                    {shouldShowDateDivider ? (
                      <p className="pt-2 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {formatMessageDate(messageTime)}
                      </p>
                    ) : null}

                    <div
                      className={clsx(
                        'flex w-full',
                        isMine ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={clsx(
                          'flex max-w-[92%] items-end gap-2 sm:max-w-[84%]',
                          isMine ? 'flex-row-reverse' : 'flex-row',
                        )}
                      >
                        {shouldShowAvatar ? (
                          <img
                            src={senderAvatar}
                            alt={message.senderName}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0" aria-hidden />
                        )}

                        <div className="min-w-0">
                          {shouldShowSenderName ? (
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

                          {shouldShowTime ? (
                            <p
                              className={clsx(
                                'mt-1 text-[11px] text-slate-500 dark:text-slate-400',
                                isMine ? 'text-right' : 'text-left',
                              )}
                            >
                              {formatMessageTime(messageTime)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSendMessage();
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
        <div className="flex h-full min-h-0 items-center justify-center p-6 text-center">
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
  );
};

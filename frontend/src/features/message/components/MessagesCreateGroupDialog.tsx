import clsx from 'clsx';

import type { MessagesCreateGroupDialogProps } from '@/features/message/types/components';

export const MessagesCreateGroupDialog = ({
  t,
  isOpen,
  groupName,
  setGroupName,
  selectedMemberIds,
  groupError,
  isCreatingGroup,
  friendCandidates,
  onClose,
  onToggleMember,
  onCreateGroup,
}: MessagesCreateGroupDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
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
                        onChange={() => onToggleMember(friend.id)}
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
              onClick={onClose}
              disabled={isCreatingGroup}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void onCreateGroup()}
              disabled={isCreatingGroup}
              className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isCreatingGroup ? t('messagesPage.creatingGroup') : t('messagesPage.createGroup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

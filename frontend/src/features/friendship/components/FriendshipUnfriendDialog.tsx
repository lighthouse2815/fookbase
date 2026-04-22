import { AlertTriangle } from 'lucide-react';

import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipUnfriendDialogProps = Pick<
  UseFriendsPageReturn,
  't' | 'confirmUnfriendUser' | 'closeUnfriendDialog' | 'isUnfriendSubmitting' | 'handleConfirmUnfriend'
>;

export const FriendshipUnfriendDialog = ({
  t,
  confirmUnfriendUser,
  closeUnfriendDialog,
  isUnfriendSubmitting,
  handleConfirmUnfriend,
}: FriendshipUnfriendDialogProps) => {
  if (!confirmUnfriendUser) {
    return null;
  }

  return (
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
  );
};

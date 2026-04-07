import clsx from 'clsx';
import { Image, Info, MessageCircle, Newspaper, UserRoundCheck, UserRoundPlus, UserRoundX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { FriendRequest, FriendSuggestion, FriendUser } from '../../types/friendship';

type PreviewTab = 'posts' | 'photos' | 'about';

type PreviewRelation = 'received' | 'sent' | 'suggestion' | 'friend' | null;

type ProfilePreviewUser = FriendSuggestion | FriendRequest | FriendUser;

interface ProfilePreviewProps {
  user: ProfilePreviewUser | null;
  relation: PreviewRelation;
  onAddFriend?: () => void;
  onConfirmRequest?: () => void;
  onDeleteRequest?: () => void;
  onCancelRequest?: () => void;
  onUnfriend?: () => void;
}

export const ProfilePreview = ({
  user,
  relation,
  onAddFriend,
  onConfirmRequest,
  onDeleteRequest,
  onCancelRequest,
  onUnfriend,
}: ProfilePreviewProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PreviewTab>('posts');
  const previewTabs: Array<{ id: PreviewTab; label: string; icon: typeof Newspaper }> = useMemo(
    () => [
      { id: 'posts', label: t('friendsPage.preview.tabs.posts'), icon: Newspaper },
      { id: 'photos', label: t('friendsPage.preview.tabs.photos'), icon: Image },
      { id: 'about', label: t('friendsPage.preview.tabs.about'), icon: Info },
    ],
    [t],
  );

  if (!user) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <UserRoundPlus size={22} />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.preview.emptyTitle')}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.preview.emptyDescription')}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="h-24 rounded-t-3xl bg-gradient-to-r from-sky-500 via-brand-500 to-indigo-500" />
      <div className="px-5 pb-5">
        <div className="-mt-12 flex items-end gap-3">
          <Link to={`/profile/${user.id}`} className="inline-flex" aria-label={user.fullName}>
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-24 w-24 rounded-3xl border-4 border-white object-cover dark:border-slate-900"
            />
          </Link>
          <div className="pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user.fullName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('friendsPage.mutualFriends', { count: user.mutualFriends })}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {relation === 'friend' ? (
            <>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <MessageCircle size={16} />
                {t('friendsPage.actions.message')}
              </button>
              <button
                type="button"
                onClick={onUnfriend}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <UserRoundX size={16} />
                {t('friendsPage.actions.unfriend')}
              </button>
            </>
          ) : null}

          {relation === 'received' ? (
            <>
              <button
                type="button"
                onClick={onConfirmRequest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <UserRoundCheck size={16} />
                {t('friendsPage.actions.confirm')}
              </button>
              <button
                type="button"
                onClick={onDeleteRequest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <UserRoundX size={16} />
                {t('friendsPage.actions.delete')}
              </button>
            </>
          ) : null}

          {relation === 'sent' ? (
            <>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <MessageCircle size={16} />
                {t('friendsPage.actions.message')}
              </button>
              <button
                type="button"
                onClick={onCancelRequest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <UserRoundX size={16} />
                {t('friendsPage.actions.cancelRequest')}
              </button>
            </>
          ) : null}

          {relation === 'suggestion' ? (
            <>
              <button
                type="button"
                onClick={onAddFriend}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <UserRoundPlus size={16} />
                {t('friendsPage.actions.addFriend')}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <MessageCircle size={16} />
                {t('friendsPage.actions.message')}
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {previewTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={clsx(
                'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition',
                activeTab === id
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
          {activeTab === 'posts' ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.preview.recentActivity')}</p>
              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t('friendsPage.preview.sampleActivity.avatarUpdated', { name: user.fullName })}
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t('friendsPage.preview.sampleActivity.joinedStudyGroup')}
              </div>
            </div>
          ) : null}

          {activeTab === 'photos' ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((photoSeed) => (
                <img
                  key={photoSeed}
                  src={`https://picsum.photos/seed/${user.id}-${photoSeed}/180/180`}
                  alt={`${user.fullName} photo ${photoSeed}`}
                  className="h-20 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          ) : null}

          {activeTab === 'about' ? (
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>
                {t('friendsPage.preview.about.faculty')}:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {user.faculty ?? t('friendsPage.preview.about.notUpdated')}
                </span>
              </p>
              <p>
                {t('friendsPage.preview.about.mutualFriends')}:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-100">{user.mutualFriends}</span>
              </p>
              {'friendsCount' in user ? (
                <p>
                  {t('friendsPage.preview.about.totalFriends')}:{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{user.friendsCount ?? 0}</span>
                </p>
              ) : null}
              {'bio' in user && user.bio ? <p className="text-xs text-slate-500 dark:text-slate-400">{user.bio}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
};

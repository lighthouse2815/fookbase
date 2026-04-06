import { Loader2, Phone, Search, UserCheck, UserPlus, UsersRound, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { friendshipService } from '../services/friendshipService';
import { profileService, type UserProfileSearchResult } from '../services/profileService';
import { getApiErrorMessage } from '../utils/apiError';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

interface StatusMeta {
  label: string;
  action: 'send' | 'cancel' | 'respond' | 'none';
  buttonLabel: string;
  buttonClassName: string;
  badgeClassName: string;
}

const normalizeStatus = (status?: string | null): string => status?.trim().toUpperCase() ?? 'NONE';

const getStatusMeta = (status: string, isSelf: boolean): StatusMeta => {
  if (isSelf) {
    return {
      label: 'Tai khoan cua ban',
      action: 'none',
      buttonLabel: 'Khong the ket ban',
      buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      badgeClassName:
        'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
    };
  }

  switch (status) {
    case 'PENDING':
      return {
        label: 'Da nhan loi moi tu nguoi nay',
        action: 'respond',
        buttonLabel: 'Chap nhan',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-sky-300/60 bg-sky-100 text-sky-800 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200',
      };
    case 'INVITED':
      return {
        label: 'Da gui loi moi',
        action: 'cancel',
        buttonLabel: 'Huy loi moi',
        buttonClassName: 'bg-slate-600 text-white hover:bg-slate-700',
        badgeClassName:
          'border border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200',
      };
    case 'ACCEPTED':
      return {
        label: 'Da la ban be',
        action: 'none',
        buttonLabel: 'Da ket ban',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200',
      };
    case 'REJECTED':
    case 'REMOVED':
    case 'NONE':
      return {
        label: 'Chua ket ban',
        action: 'send',
        buttonLabel: 'Gui ket ban',
        buttonClassName: 'bg-brand-600 text-white hover:bg-brand-700',
        badgeClassName:
          'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
      };
    case 'BLOCKED':
      return {
        label: 'Khong the ket ban luc nay',
        action: 'none',
        buttonLabel: 'Khong kha dung',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-rose-300/60 bg-rose-100 text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200',
      };
    default:
      return {
        label: `Trang thai: ${status}`,
        action: 'none',
        buttonLabel: 'Khong kha dung',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
      };
  }
};

export const FriendSearchPage = () => {
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [results, setResults] = useState<UserProfileSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'send' | 'cancel' | 'accept' | 'reject' | null>(null);

  const phoneNumberQuery = searchParams.get('phoneNumber')?.trim() ?? '';

  useEffect(() => {
    setSearchInput(phoneNumberQuery);
  }, [phoneNumberQuery]);

  useEffect(() => {
    if (!phoneNumberQuery) {
      setFetchState('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    let isCancelled = false;

    const loadResults = async () => {
      setFetchState('loading');
      setErrorMessage(null);
      setActionMessage(null);

      try {
        const response = await profileService.searchProfilesByPhoneNumber(phoneNumberQuery);
        if (isCancelled) {
          return;
        }

        setResults(response);
        setFetchState('success');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setResults([]);
        setFetchState('error');
        setErrorMessage(getApiErrorMessage(error, 'Khong tim thay nguoi dung phu hop.'));
      }
    };

    void loadResults();

    return () => {
      isCancelled = true;
    };
  }, [phoneNumberQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhoneNumber = searchInput.trim();

    if (!normalizedPhoneNumber) {
      setSearchParams({});
      return;
    }

    setSearchParams({ phoneNumber: normalizedPhoneNumber });
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('send');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.sendFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'INVITED' } : item)),
      );
      setActionMessage('Da gui loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gui loi moi ket ban that bai.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleCancelSentRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('cancel');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.cancelSentRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'NONE' } : item)),
      );
      setActionMessage('Da huy loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Huy loi moi ket ban that bai.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleAcceptReceivedRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('accept');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.acceptFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'ACCEPTED' } : item)),
      );
      setActionMessage('Da chap nhan loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Chap nhan loi moi that bai.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleRejectReceivedRequest = async (targetUserId: string) => {
    setActionUserId(targetUserId);
    setActionType('reject');
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.deleteFriendRequest(targetUserId);

      setResults((existing) =>
        existing.map((item) => (item.userId === targetUserId ? { ...item, status: 'NONE' } : item)),
      );
      setActionMessage('Da tu choi loi moi ket ban.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Tu choi loi moi that bai.'));
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const showEmptyState = fetchState === 'success' && results.length === 0;

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tim ban be theo so dien thoai</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Nhap so dien thoai va nhan Enter de tim nhanh.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <UsersRound size={14} />
            {results.length} ket qua
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-4">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nhap so dien thoai can tim..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Tim
            </button>
          </label>
        </form>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        {actionMessage ? (
          <p className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200">
            {actionMessage}
          </p>
        ) : null}
      </header>

      {fetchState === 'loading' ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
            <Loader2 size={16} className="animate-spin" />
            Dang tim kiem...
          </div>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          Khong tim thay nguoi dung nao cho so dien thoai nay.
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((profile) => {
            const status = normalizeStatus(profile.status);
            const isSelf = profile.userId === currentUser.id;
            const statusMeta = getStatusMeta(status, isSelf);
            const isProcessingAction = actionUserId === profile.userId;
            const isActionEnabled = statusMeta.action !== 'none';

            return (
              <article
                key={profile.userId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${profile.userId}`} className="inline-flex shrink-0" aria-label={profile.displayName}>
                      <img
                        src={profile.avatarUrl ?? `https://i.pravatar.cc/150?u=${profile.userId}`}
                        alt={profile.displayName}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {profile.displayName}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Phone size={12} />
                        {profile.phoneNumber}
                      </p>
                      <p
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
                      >
                        {statusMeta.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {statusMeta.action === 'respond' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => void handleAcceptReceivedRequest(profile.userId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessingAction && actionType === 'accept' ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <UserCheck size={15} />
                          )}
                          {isProcessingAction && actionType === 'accept' ? 'Dang chap nhan...' : 'Chap nhan'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => void handleRejectReceivedRequest(profile.userId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessingAction && actionType === 'reject' ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <X size={15} />
                          )}
                          {isProcessingAction && actionType === 'reject' ? 'Dang tu choi...' : 'Tu choi'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!isActionEnabled || isProcessingAction}
                        onClick={() =>
                          void (statusMeta.action === 'cancel'
                            ? handleCancelSentRequest(profile.userId)
                            : handleSendFriendRequest(profile.userId))
                        }
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${statusMeta.buttonClassName}`}
                      >
                        {isProcessingAction ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : statusMeta.action === 'cancel' ? (
                          <X size={15} />
                        ) : (
                          <UserPlus size={15} />
                        )}
                        {isProcessingAction
                          ? statusMeta.action === 'cancel'
                            ? 'Dang huy...'
                            : 'Dang gui...'
                          : statusMeta.buttonLabel}
                      </button>
                    )}

                    <Link
                      to={`/profile/${profile.userId}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Xem trang ca nhan
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
};

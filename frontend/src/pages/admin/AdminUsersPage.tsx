import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CornerToast } from '../../components/CornerToast';
import { useCornerToast } from '../../hooks/useCornerToast';
import { friendshipService } from '../../services/friendshipService';
import { profileService, type UserProfileSearchResult } from '../../services/profileService';
import { getApiErrorMessage } from '../../utils/apiError';

const phonePattern = /^0\d{9}$/;

export const AdminUsersPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [users, setUsers] = useState<UserProfileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const { toast, showToast } = useCornerToast();

  const handleSearch = async () => {
    const normalizedPhone = phoneNumber.trim();
    if (!phonePattern.test(normalizedPhone)) {
      setErrorMessage('So dien thoai phai dung dinh dang 0xxxxxxxxx.');
      setUsers([]);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const result = await profileService.searchProfilesByPhoneNumber(normalizedPhone);
      setUsers(result);
    } catch (error) {
      setUsers([]);
      setErrorMessage(getApiErrorMessage(error, 'Khong tim thay user phu hop.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (processingUserId) {
      return;
    }

    setProcessingUserId(userId);
    try {
      await friendshipService.blockUser(userId);
      showToast('Da chan user.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Chan user that bai.'), 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReportUser = async (userId: string) => {
    if (processingUserId) {
      return;
    }

    setProcessingUserId(userId);
    try {
      await friendshipService.reportUser(userId, `Admin report user ${userId}`);
      showToast('Da gui bao cao user.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Bao cao user that bai.'), 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quan ly user</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tim user theo so dien thoai va thuc hien thao tac quan tri.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Nhap so dien thoai (0xxxxxxxxx)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isSearching}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSearching ? 'Dang tim...' : 'Tim user'}
          </button>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {errorMessage}
        </section>
      ) : null}

      {users.length === 0 && !isSearching ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          Chua co user nao trong ket qua tim kiem.
        </section>
      ) : null}

      <section className="space-y-3">
        {users.map((item) => {
          const isActing = processingUserId === item.userId;
          return (
            <article
              key={item.userId}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`}
                  alt={item.displayName}
                  className="h-12 w-12 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">UserId: {item.userId}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phone: {item.phoneNumber}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/profile/${item.userId}`}
                  className="inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Xem profile
                </Link>
                <button
                  type="button"
                  onClick={() => void handleBlockUser(item.userId)}
                  disabled={isActing}
                  className="rounded-xl bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isActing ? 'Dang xu ly...' : 'Chan user'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleReportUser(item.userId)}
                  disabled={isActing}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Bao cao user
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

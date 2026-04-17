import { AlertTriangle, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CornerToast } from '../../components/CornerToast';
import { EmptyStateCard } from '../../components/EmptyStateCard';
import { useCornerToast } from '../../hooks/useCornerToast';
import { useLocaleText } from '../../hooks/useLocaleText';
import type { AdminUserItem } from '@/interface/admin';
import { adminService } from '../../services/adminService';
import { getApiErrorMessage } from '../../utils/apiError';

const getStatusBadgeClass = (status: string): string => {
  const normalized = status.trim().toUpperCase();

  if (normalized === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }

  if (normalized === 'BANNED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
};

const getRoleBadgeClass = (role: string): string => {
  const normalized = role.trim().toUpperCase();
  return normalized === 'ADMIN'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100';
};

export const AdminUsersPage = () => {
  const tx = useLocaleText();
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserItem | null>(null);
  const { toast, showToast } = useCornerToast();

  const loadUsers = useCallback(async (searchKeyword?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminService.searchUsers(searchKeyword);
      setUsers(result);
    } catch (error) {
      setUsers([]);
      setErrorMessage(getApiErrorMessage(error, tx('Không thể tải danh sách user.', 'Could not load users.')));
    } finally {
      setIsLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSearch = async () => {
    await loadUsers(keyword.trim() || undefined);
  };

  const handleUpdateUserStatus = async (user: AdminUserItem, status: 'ACTIVE' | 'BANNED') => {
    if (processingUserId) {
      return;
    }

    setProcessingUserId(user.userId);
    try {
      const updated = await adminService.updateUserStatus(user.userId, status);
      setUsers((previous) => previous.map((item) => (item.userId === updated.userId ? updated : item)));

      if (status === 'BANNED') {
        showToast(tx('Đã khóa tài khoản user.', 'User account has been banned.'), 'success');
      } else {
        showToast(tx('Đã mở khóa tài khoản user.', 'User account has been unbanned.'), 'success');
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Cập nhật trạng thái user thất bại.', 'Failed to update user status.')), 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const bannedCount = useMemo(
    () => users.filter((item) => item.status.trim().toUpperCase() === 'BANNED').length,
    [users],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Quản lý user', 'User management')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Tìm user theo username, email, số điện thoại và khóa/mở khóa tài khoản.',
            'Search users by username, email, phone and ban/unban accounts.',
          )}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder={tx('Nhập từ khóa tìm user...', 'Search users...')}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isLoading}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? tx('Đang tìm...', 'Searching...') : tx('Tìm user', 'Search')}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Kết quả', 'Results')}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{users.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Tài khoản bị khóa', 'Banned accounts')}</p>
            <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-300">{bannedCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Admin trong kết quả', 'Admins in result')}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {users.filter((item) => item.role.trim().toUpperCase() === 'ADMIN').length}
            </p>
          </article>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {errorMessage}
        </section>
      ) : null}

      {users.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={Users}
          title={tx('Không có user phù hợp', 'No matching users')}
          description={tx(
            'Thử từ khóa khác như username, email hoặc số điện thoại.',
            'Try another keyword such as username, email, or phone number.',
          )}
          actionLabel={tx('Tải lại danh sách', 'Reload list')}
          onAction={() => {
            void loadUsers();
          }}
        />
      ) : null}

      <section className="space-y-3">
        {users.map((item) => {
          const status = item.status.trim().toUpperCase();
          const isBanned = status === 'BANNED';
          const isActing = processingUserId === item.userId;

          return (
            <article
              key={item.userId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`}
                    alt={item.displayName}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{item.username || 'user'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.email || item.phoneNumber || item.userId}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(item.role)}`}>
                    {item.role}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to={`/profile/${item.userId}`}
                  className="inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {tx('Xem trang cá nhân', 'View profile')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (isBanned) {
                      void handleUpdateUserStatus(item, 'ACTIVE');
                    } else {
                      setConfirmTarget(item);
                    }
                  }}
                  disabled={isActing}
                  className={`rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isBanned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isActing
                    ? tx('Đang xử lý...', 'Processing...')
                    : isBanned
                      ? tx('Mở khóa tài khoản', 'Unban account')
                      : tx('Khóa tài khoản', 'Ban account')}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {confirmTarget ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/70" onClick={() => setConfirmTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {tx('Xác nhận khóa tài khoản', 'Confirm ban account')}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {tx('Bạn chắc chắn muốn khóa tài khoản', 'Are you sure you want to ban')}{' '}
                  <span className="font-semibold">{confirmTarget.displayName}</span>?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {tx('Hủy', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUpdateUserStatus(confirmTarget, 'BANNED');
                  setConfirmTarget(null);
                }}
                className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {tx('Xác nhận khóa', 'Confirm ban')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

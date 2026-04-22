import { AlertTriangle, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { EmptyStateCard } from '@/shared/ui/feedback/EmptyStateCard';

import { useAdminUsersPage } from '@/features/admin/hooks/useAdminUsersPage';
import {
  DEFAULT_ADMIN_AVATAR_URL,
  getAdminRoleBadgeClass,
  getAdminUserStatusBadgeClass,
} from '@/features/admin/utils/user.util';

export const AdminUsersPage = () => {
  const {
    tx,
    keyword,
    setKeyword,
    users,
    isLoading,
    errorMessage,
    processingUserId,
    confirmTarget,
    setConfirmTarget,
    loadUsers,
    handleSearch,
    handleUpdateUserStatus,
    bannedCount,
    adminCount,
    toast,
  } = useAdminUsersPage();

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
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{adminCount}</p>
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
                    src={item.avatarUrl || DEFAULT_ADMIN_AVATAR_URL}
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
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAdminRoleBadgeClass(item.role)}`}>
                    {item.role}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAdminUserStatusBadgeClass(item.status)}`}>
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



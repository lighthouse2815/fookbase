import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, FileWarning, UserRoundX, Users } from 'lucide-react';

import { adminService, type AdminDashboard } from '../../services/adminService';
import { getApiErrorMessage } from '../../utils/apiError';

const defaultDashboard: AdminDashboard = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  inactiveUsers: 0,
  totalPosts: 0,
  pendingPostReports: 0,
  pendingUserReports: 0,
  pendingStoryReports: 0,
  monthlyMetrics: [],
};

export const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState<AdminDashboard>(defaultDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getDashboard();
      setDashboard(result);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Khong the tai du lieu tong quan admin.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxBarValue = useMemo(() => {
    return dashboard.monthlyMetrics.reduce((max, item) => Math.max(max, item.users, item.posts), 1);
  }, [dashboard.monthlyMetrics]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tong quan quan tri</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Theo doi bien dong user, bai dang va report de dieu phoi duyet noi dung.
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Users size={15} />
            Tong user
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{dashboard.totalUsers}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Active: {dashboard.activeUsers} - Inactive: {dashboard.inactiveUsers}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Activity size={15} />
            Tong bai dang
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{dashboard.totalPosts}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bao gom bai dang dang hien thi.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <FileWarning size={15} />
            Report dang cho
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {dashboard.pendingPostReports + dashboard.pendingUserReports + dashboard.pendingStoryReports}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Post: {dashboard.pendingPostReports} - User: {dashboard.pendingUserReports} - Story: {dashboard.pendingStoryReports}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <UserRoundX size={15} />
            User bi khoa
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-300">{dashboard.bannedUsers}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">So tai khoan dang o trang thai BANNED.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <BarChart3 size={16} />
            Bieu do cot user va bai dang theo thang
          </h2>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isLoading ? 'Dang tai...' : 'Tai lai'}
          </button>
        </div>

        {dashboard.monthlyMetrics.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chua co du lieu bieu do.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-6 gap-3">
                {dashboard.monthlyMetrics.map((item) => {
                  const usersHeight = Math.max(8, Math.round((item.users / maxBarValue) * 160));
                  const postsHeight = Math.max(8, Math.round((item.posts / maxBarValue) * 160));
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2">
                      <div className="flex h-44 items-end gap-1">
                        <div
                          className="w-5 rounded-t-md bg-sky-500"
                          style={{ height: `${usersHeight}px` }}
                          title={`Users: ${item.users}`}
                        />
                        <div
                          className="w-5 rounded-t-md bg-emerald-500"
                          style={{ height: `${postsHeight}px` }}
                          title={`Posts: ${item.posts}`}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.month}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        U:{item.users} P:{item.posts}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            User moi
          </p>
          <p className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Bai dang moi
          </p>
        </div>
      </section>
    </div>
  );
};

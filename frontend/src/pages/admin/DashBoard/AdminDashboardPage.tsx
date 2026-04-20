import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, FileWarning, UserRoundX, Users } from 'lucide-react';

import { EmptyStateCard } from '@/components/EmptyStateCard';
import { useLocaleText } from '@/hooks/useLocaleText';
import type { AdminDashboard } from '@/interface/admin';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/utils/apiError';

const defaultDashboard: AdminDashboard = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  inactiveUsers: 0,
  totalPosts: 0,
  pendingPostReports: 0,
  pendingCommentReports: 0,
  pendingUserReports: 0,
  pendingStoryReports: 0,
  monthlyMetrics: [],
};

export const AdminDashboardPage = () => {
  const tx = useLocaleText();
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
      setErrorMessage(getApiErrorMessage(error, tx('Không thể tải dữ liệu tổng quan admin.', 'Could not load admin dashboard.')));
    } finally {
      setIsLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxBarValue = useMemo(() => {
    return dashboard.monthlyMetrics.reduce((max, item) => Math.max(max, item.users, item.posts), 1);
  }, [dashboard.monthlyMetrics]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tx('Tổng quan quản trị', 'Admin overview')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Theo dõi biến động người dùng, bài đăng và báo cáo để điều phối duyệt nội dung.',
            'Track users, posts and reports to moderate content effectively.',
          )}
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
            {tx('Tổng người dùng', 'Total users')}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{dashboard.totalUsers}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {tx('Đang hoạt động', 'Active')}: {dashboard.activeUsers} - {tx('Chưa kích hoạt', 'Inactive')}: {dashboard.inactiveUsers}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Activity size={15} />
            {tx('Tổng bài đăng', 'Total posts')}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{dashboard.totalPosts}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {tx('Bao gồm các bài đăng hiện còn hiển thị.', 'Including currently visible posts.')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <FileWarning size={15} />
            {tx('Báo cáo chờ xử lý', 'Pending reports')}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {dashboard.pendingPostReports + dashboard.pendingCommentReports + dashboard.pendingUserReports + dashboard.pendingStoryReports}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Post: {dashboard.pendingPostReports} - Comment: {dashboard.pendingCommentReports} - User: {dashboard.pendingUserReports} - Story:{' '}
            {dashboard.pendingStoryReports}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <UserRoundX size={15} />
            {tx('Tài khoản bị khóa', 'Banned users')}
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-300">{dashboard.bannedUsers}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {tx('Số tài khoản đang ở trạng thái BANNED.', 'Accounts currently in BANNED status.')}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <BarChart3 size={16} />
            {tx('Biểu đồ cột user và bài đăng theo tháng', 'Monthly users and posts chart')}
          </h2>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isLoading ? tx('Đang tải...', 'Loading...') : tx('Tải lại', 'Refresh')}
          </button>
        </div>

        {dashboard.monthlyMetrics.length === 0 ? (
          <div className="mt-4">
            <EmptyStateCard
              icon={BarChart3}
              title={tx('Chưa có dữ liệu biểu đồ', 'No chart data yet')}
              description={tx(
                'Dữ liệu sẽ xuất hiện sau khi hệ thống ghi nhận thêm người dùng hoặc bài đăng.',
                'Data will appear after the system records more users or posts.',
              )}
            />
          </div>
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
            {tx('User mới', 'New users')}
          </p>
          <p className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {tx('Bài đăng mới', 'New posts')}
          </p>
        </div>
      </section>
    </div>
  );
};

import { ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyStateCard } from '../../components/EmptyStateCard';
import { useAuth } from '../../contexts/AuthContext';
import { useLocaleText } from '../../hooks/useLocaleText';

export const AdminProfilePage = () => {
  const tx = useLocaleText();
  const { user, roles } = useAuth();

  if (!user) {
    return (
      <EmptyStateCard
        icon={UserRound}
        title={tx('Không thể tải thông tin admin', 'Unable to load admin profile')}
        description={tx(
          'Vui lòng làm mới trang hoặc đăng nhập lại.',
          'Please refresh the page or login again.',
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Hồ sơ admin', 'Admin profile')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tx('Thông tin tài khoản quản trị đang đăng nhập.', 'Information of the currently logged-in admin account.')}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img src={user.avatarUrl} alt={user.fullName} className="h-20 w-20 rounded-full border border-slate-200 object-cover dark:border-slate-700" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
            {user.email ? <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p> : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <ShieldCheck size={16} />
              {tx('Quyền hạn', 'Permissions')}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{roles.join(', ') || 'ADMIN'}</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <UserRound size={16} />
              {tx('Trang cá nhân', 'Profile page')}
            </p>
            <Link to={`/profile/${user.id}`} className="mt-2 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
              {tx('Mở profile công khai', 'Open public profile')}
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
};

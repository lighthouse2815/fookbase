import { ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

export const AdminProfilePage = () => {
  const { user, roles } = useAuth();

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        Khong the tai thong tin admin.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ho so admin</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Thong tin tai khoan quan tri dang dang nhap.</p>
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
              Quyen han
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{roles.join(', ') || 'ADMIN'}</p>
          </article>

          <article className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <UserRound size={16} />
              Trang ca nhan
            </p>
            <Link to={`/profile/${user.id}`} className="mt-2 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
              Mo profile cong khai
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
};


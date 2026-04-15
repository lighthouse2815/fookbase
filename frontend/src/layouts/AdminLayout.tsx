import { Shield, UserCog, FileWarning, Flag, MessageSquareWarning, LogOut } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export const AdminLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-brand-600 p-2 text-white">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">Admin Console</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.username ?? 'admin'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-4 pb-8 pt-4 sm:px-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:sticky md:top-4 md:h-fit">
          <nav className="space-y-1">
            <NavLink to="/admin/users" className={navLinkClassName}>
              <UserCog size={16} />
              User Management
            </NavLink>
            <NavLink to="/admin/reports/posts" className={navLinkClassName}>
              <FileWarning size={16} />
              Post Reports
            </NavLink>
            <NavLink to="/admin/reports/users" className={navLinkClassName}>
              <Flag size={16} />
              User Reports
            </NavLink>
            <NavLink to="/admin/reports/comments" className={navLinkClassName}>
              <MessageSquareWarning size={16} />
              Comment Reports
            </NavLink>
          </nav>
        </aside>

        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

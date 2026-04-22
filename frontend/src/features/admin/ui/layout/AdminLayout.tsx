import { Outlet } from 'react-router-dom';

import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { AdminHeader } from '@/features/admin/ui/navigation/AdminHeader';
import { AdminSideNav } from '@/features/admin/ui/navigation/AdminSideNav';
import { useAdminLayout } from '@/features/admin/hooks/useAdminLayout';

export const AdminLayout = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const {
    popoverRootRef,
    openPopover,
    isSidebarOpen,
    isVietnameseActive,
    isEnglishActive,
    togglePopover,
    closePopover,
    toggleSidebar,
    closeSidebar,
    changeLanguage,
  } = useAdminLayout();

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AdminHeader
        user={user}
        resolvedTheme={resolvedTheme}
        openPopover={openPopover}
        popoverRootRef={popoverRootRef}
        isVietnameseActive={isVietnameseActive}
        isEnglishActive={isEnglishActive}
        onToggleSidebar={toggleSidebar}
        onToggleTheme={toggleTheme}
        onTogglePopover={togglePopover}
        onChangeLanguage={changeLanguage}
        onClosePopover={closePopover}
        onLogout={logout}
      />

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/65" onClick={closeSidebar} />
          <aside className="relative h-full w-[min(18rem,calc(100vw-2rem))] overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <AdminSideNav onItemClick={closeSidebar} />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-[1360px] gap-4 px-3 pb-8 pt-4 sm:px-4 lg:px-6 md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:sticky md:top-4 md:block md:h-fit">
          <AdminSideNav />
        </aside>

        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};



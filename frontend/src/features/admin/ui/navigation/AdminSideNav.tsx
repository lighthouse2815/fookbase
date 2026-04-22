import { NavLink } from 'react-router-dom';

import { useLocaleText } from '@/shared/i18n/useLocaleText';
import { ADMIN_NAV_ITEMS } from '@/features/admin/config/adminNavItems';

interface AdminSideNavProps {
  onItemClick?: () => void;
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export const AdminSideNav = ({ onItemClick }: AdminSideNavProps) => {
  const tx = useLocaleText();

  return (
    <nav className="space-y-1">
      {ADMIN_NAV_ITEMS.map(({ path, icon: Icon, viLabel, enLabel }) => (
        <NavLink key={path} to={path} className={navLinkClassName} onClick={onItemClick}>
          <Icon size={16} />
          {tx(viLabel, enLabel)}
        </NavLink>
      ))}
    </nav>
  );
};



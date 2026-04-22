import {
  BarChart3,
  BellRing,
  FileWarning,
  Flag,
  MessageSquareWarning,
  Shield,
  UserCircle2,
  UserCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  path: string;
  icon: LucideIcon;
  viLabel: string;
  enLabel: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    path: '/admin/dashboard',
    icon: BarChart3,
    viLabel: 'Tong quan',
    enLabel: 'Dashboard',
  },
  {
    path: '/admin/users',
    icon: UserCog,
    viLabel: 'Quan ly nguoi dung',
    enLabel: 'User management',
  },
  {
    path: '/admin/reports/posts',
    icon: FileWarning,
    viLabel: 'Bao cao bai dang',
    enLabel: 'Post reports',
  },
  {
    path: '/admin/reports/users',
    icon: Flag,
    viLabel: 'Bao cao nguoi dung',
    enLabel: 'User reports',
  },
  {
    path: '/admin/reports/comments',
    icon: MessageSquareWarning,
    viLabel: 'Bao cao binh luan',
    enLabel: 'Comment reports',
  },
  {
    path: '/admin/reports/stories',
    icon: BellRing,
    viLabel: 'Bao cao story',
    enLabel: 'Story reports',
  },
  {
    path: '/admin/audit-logs',
    icon: Shield,
    viLabel: 'Lich su duyet',
    enLabel: 'Audit logs',
  },
  {
    path: '/admin/profile',
    icon: UserCircle2,
    viLabel: 'Ho so admin',
    enLabel: 'Admin profile',
  },
];

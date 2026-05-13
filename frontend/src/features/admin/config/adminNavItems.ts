import {
  BarChart3,
  BellRing,
  FileWarning,
  Flag,
  Hash,
  MessageSquareWarning,
  Shield,
  Star,
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
    viLabel: 'Tổng quan',
    enLabel: 'Dashboard',
  },
  {
    path: '/admin/users',
    icon: UserCog,
    viLabel: 'Quản lý người dùng',
    enLabel: 'User management',
  },
  {
    path: '/admin/reports/posts',
    icon: FileWarning,
    viLabel: 'Báo cáo bài đăng',
    enLabel: 'Post reports',
  },
  {
    path: '/admin/reports/users',
    icon: Flag,
    viLabel: 'Báo cáo người dùng',
    enLabel: 'User reports',
  },
  {
    path: '/admin/reports/comments',
    icon: MessageSquareWarning,
    viLabel: 'Báo cáo bình luận',
    enLabel: 'Comment reports',
  },
  {
    path: '/admin/reports/stories',
    icon: BellRing,
    viLabel: 'Báo cáo story',
    enLabel: 'Story reports',
  },
  {
    path: '/admin/reviews',
    icon: Star,
    viLabel: 'Đánh giá ứng dụng',
    enLabel: 'App reviews',
  },
  {
    path: '/admin/hashtags',
    icon: Hash,
    viLabel: 'Hashtag',
    enLabel: 'Hashtags',
  },
  {
    path: '/admin/audit-logs',
    icon: Shield,
    viLabel: 'Lịch sử duyệt',
    enLabel: 'Audit logs',
  },
  {
    path: '/admin/profile',
    icon: UserCircle2,
    viLabel: 'Hồ sơ admin',
    enLabel: 'Admin profile',
  },
];

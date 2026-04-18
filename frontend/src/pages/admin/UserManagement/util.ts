export const getStatusBadgeClass = (status: string): string => {
  const normalized = status.trim().toUpperCase();

  if (normalized === 'ACTIVE') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }

  if (normalized === 'BANNED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
};

export const getRoleBadgeClass = (role: string): string => {
  const normalized = role.trim().toUpperCase();
  return normalized === 'ADMIN'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100';
};

export const PAGE_SIZE = 20;

export const getAdminReportStatusBadgeClass = (status: string) => {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'RESOLVED') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }

  if (normalized === 'REJECTED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
};

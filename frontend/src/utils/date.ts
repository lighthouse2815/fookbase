export const formatRelativeTime = (isoDate: string): string => {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = now.getTime() - target.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes}m`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}h`;
  }

  const days = Math.floor(diffMs / day);
  return `${days}d`;
};


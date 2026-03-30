const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

const parseApiDate = (value: string): Date => {
  const normalized = value.trim();
  if (!normalized) {
    return new Date(NaN);
  }

  if (HAS_TIMEZONE_SUFFIX.test(normalized)) {
    return new Date(normalized);
  }

  // Backend timestamps may come without timezone suffix; treat them as UTC.
  return new Date(`${normalized}Z`);
};

export const formatRelativeTime = (isoDate: string): string => {
  const now = new Date();
  const target = parseApiDate(isoDate);
  if (Number.isNaN(target.getTime())) {
    return '1m';
  }

  const diffMs = now.getTime() - target.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs <= 0) {
    return '1m';
  }

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


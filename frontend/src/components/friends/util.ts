import type { TFunction } from 'i18next';

export function formatFriendRequestTime(requestedAt: string | undefined, t: TFunction): string {
  if (!requestedAt) {
    return t('friendsPage.time.justNow');
  }

  const requestedDate = new Date(requestedAt);

  if (Number.isNaN(requestedDate.getTime())) {
    return t('friendsPage.time.justNow');
  }

  const difference = Date.now() - requestedDate.getTime();
  const minutes = Math.max(1, Math.floor(difference / (1000 * 60)));

  if (minutes < 60) {
    return t('friendsPage.time.minutesAgo', { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('friendsPage.time.hoursAgo', { count: hours });
  }

  const days = Math.floor(hours / 24);
  return t('friendsPage.time.daysAgo', { count: days });
}

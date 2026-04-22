import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BlockedUser } from '@/features/friendship/types/contracts';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';
import { getApiErrorMessage } from '@/shared/api/error';
import type { UseBlockedUsersSettingsPageReturn } from '@/features/settings/types/hooks';

export const useBlockedUsersSettingsPage = (): UseBlockedUsersSettingsPageReturn => {
  const { t, i18n } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  const formatBlockedAt = (value?: string): string | null => {
    if (!value) {
      return null;
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return value;
    }

    return dateFormatter.format(new Date(timestamp));
  };

  const loadBlockedUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const users = await friendshipService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      setBlockedUsers([]);
      setErrorMessage(getApiErrorMessage(error, t('blockedUsersSettings.loadError')));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = async (targetUserId: string) => {
    if (unblockingUserId) {
      return;
    }

    setUnblockingUserId(targetUserId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      await friendshipService.unblockUser(targetUserId);
      setBlockedUsers((previous) => previous.filter((user) => user.id !== targetUserId));
      setActionMessage(t('blockedUsersSettings.unblockSuccess'));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('blockedUsersSettings.unblockError')));
    } finally {
      setUnblockingUserId(null);
    }
  };

  return {
    t,
    blockedUsers,
    isLoading,
    errorMessage,
    actionMessage,
    unblockingUserId,
    loadBlockedUsers,
    handleUnblock,
    formatBlockedAt,
  };
};

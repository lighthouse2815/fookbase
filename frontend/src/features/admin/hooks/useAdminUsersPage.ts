import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { useLocaleText } from '@/shared/i18n/useLocaleText';
import type { AdminUserItem } from '@/features/admin/types/admin';
import { adminService } from '@/features/admin/api/service/adminService';
import { getApiErrorMessage } from '@/shared/api/error';

export const useAdminUsersPage = () => {
  const tx = useLocaleText();
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserItem | null>(null);
  const { toast, showToast } = useCornerToast();

  const loadUsers = useCallback(async (searchKeyword?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await adminService.searchUsers(searchKeyword);
      setUsers(result);
    } catch (error) {
      setUsers([]);
      setErrorMessage(getApiErrorMessage(error, tx('Không thể tải danh sách user.', 'Could not load users.')));
    } finally {
      setIsLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSearch = async () => {
    await loadUsers(keyword.trim() || undefined);
  };

  const handleUpdateUserStatus = async (user: AdminUserItem, status: 'ACTIVE' | 'BANNED') => {
    if (processingUserId) {
      return;
    }

    setProcessingUserId(user.userId);
    try {
      const updated = await adminService.updateUserStatus(user.userId, status);
      setUsers((previous) => previous.map((item) => (item.userId === updated.userId ? updated : item)));

      if (status === 'BANNED') {
        showToast(tx('Đã khóa tài khoản user.', 'User account has been banned.'), 'success');
      } else {
        showToast(tx('Đã mở khóa tài khoản user.', 'User account has been unbanned.'), 'success');
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Cập nhật trạng thái user thất bại.', 'Failed to update user status.')), 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const bannedCount = useMemo(
    () => users.filter((item) => item.status.trim().toUpperCase() === 'BANNED').length,
    [users],
  );

  const adminCount = useMemo(
    () => users.filter((item) => item.role.trim().toUpperCase() === 'ADMIN').length,
    [users],
  );

  return {
    tx,
    keyword,
    setKeyword,
    users,
    isLoading,
    errorMessage,
    processingUserId,
    confirmTarget,
    setConfirmTarget,
    loadUsers,
    handleSearch,
    handleUpdateUserStatus,
    bannedCount,
    adminCount,
    toast,
  };
};

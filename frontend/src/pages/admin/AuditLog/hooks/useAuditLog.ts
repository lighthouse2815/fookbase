import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocaleText } from '@/hooks/useLocaleText';
import type { AdminAuditLogItem } from '@/interface/admin';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/utils/apiError';

import { PAGE_SIZE } from '../../reportUtils';

export const useAuditLog = () => {
  const tx = useLocaleText();
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadLogs = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      try {
        const response = await adminService.getAuditLogs(targetPage, PAGE_SIZE);
        setLogs((previous) => (replace ? response.items : [...previous, ...response.items]));
        setHasMore(response.hasMore);
        setPage(targetPage);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, tx('Không thể tải lịch sử thao tác admin.', 'Could not load admin audit logs.')));
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [tx],
  );

  useEffect(() => {
    void loadLogs(1, true);
  }, [loadLogs]);

  return {
    tx,
    logs,
    page,
    hasMore,
    isLoading,
    errorMessage,
    loadLogs,
  };
};

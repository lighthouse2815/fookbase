import { useCallback, useEffect, useRef, useState } from 'react';

import { useCornerToast } from '@/hooks/useCornerToast';
import { useLocaleText } from '@/hooks/useLocaleText';
import type { UserReportItem } from '@/interface/report';
import { userReportService } from '@/services/userReportService';
import { getApiErrorMessage } from '@/utils/apiError';
import { PAGE_SIZE } from '../reportUtils';

export const useReportUser = () => {
  const tx = useLocaleText();
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingActionReportId, setPendingActionReportId] = useState<string | null>(null);
  const [approveConfirmReportId, setApproveConfirmReportId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const { toast, showToast } = useCornerToast();

  const loadReports = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await userReportService.getAll(targetPage, PAGE_SIZE);
      setReports((previous) => (replace ? response.items : [...previous, ...response.items]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, tx('Không thể tải danh sách báo cáo user.', 'Could not load user reports.')));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    if (pendingActionReportId) {
      return;
    }

    setPendingActionReportId(reportId);

    try {
      const updated = await userReportService.resolve(reportId, status);
      setReports((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        status === 'RESOLVED'
          ? tx('Đã duyệt báo cáo user.', 'User report approved.')
          : tx('Đã từ chối báo cáo user.', 'User report rejected.'),
        'success',
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Xử lý báo cáo user thất bại.', 'Failed to process user report.')), 'error');
    } finally {
      setPendingActionReportId(null);
    }
  };

  return {
    tx,
    reports,
    page,
    hasMore,
    isLoading,
    loadError,
    pendingActionReportId,
    approveConfirmReportId,
    setApproveConfirmReportId,
    loadReports,
    resolveReport,
    toast,
  };
};

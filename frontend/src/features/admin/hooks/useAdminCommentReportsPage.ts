import { useCallback, useEffect, useRef, useState } from 'react';

import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { useLocaleText } from '@/shared/i18n/useLocaleText';
import type { CommentReportItem } from '@/features/comment/types/contracts';
import { commentReportService } from '@/features/comment/api/service/commentReportService';
import { getApiErrorMessage } from '@/shared/api/error';
import { PAGE_SIZE } from '@/features/admin/utils/report.util';

export const useAdminCommentReportsPage = () => {
  const tx = useLocaleText();
  const [reports, setReports] = useState<CommentReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingActionReportId, setPendingActionReportId] = useState<string | null>(null);
  const [approveConfirmReportId, setApproveConfirmReportId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const { toast, showToast } = useCornerToast();

  const loadReports = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const response = await commentReportService.getAll(targetPage, PAGE_SIZE);
        setReports((previous) => (replace ? response.items : [...previous, ...response.items]));
        setHasMore(response.hasMore);
        setPage(targetPage);
        setLoadError(null);
      } catch (error) {
        setLoadError(getApiErrorMessage(error, tx('Không thể tải danh sách báo cáo bình luận.', 'Could not load comment reports.')));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [tx],
  );

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    if (pendingActionReportId) {
      return;
    }

    setPendingActionReportId(reportId);

    try {
      const updated = await commentReportService.resolve(reportId, status);
      setReports((previous) => previous.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      showToast(
        status === 'RESOLVED'
          ? tx('Đã duyệt báo cáo bình luận.', 'Comment report approved.')
          : tx('Đã từ chối báo cáo bình luận.', 'Comment report rejected.'),
        'success',
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Xử lý báo cáo bình luận thất bại.', 'Failed to process comment report.')), 'error');
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

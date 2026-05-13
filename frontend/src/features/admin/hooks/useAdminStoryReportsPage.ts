import { useCallback, useEffect, useRef, useState } from 'react';

import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { useLocaleText } from '@/shared/i18n/useLocaleText';
import type { StoryReportItem } from '@/features/admin/types/report';
import { storyReportService } from '@/features/admin/api/service/storyReportService';
import { getApiErrorMessage } from '@/shared/api/error';
import { PAGE_SIZE } from '@/features/admin/utils/report.util';

export const useAdminStoryReportsPage = () => {
  const tx = useLocaleText();
  const [reports, setReports] = useState<StoryReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingActionReportId, setPendingActionReportId] = useState<string | null>(null);
  const [approveConfirmReport, setApproveConfirmReport] = useState<StoryReportItem | null>(null);
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
        const response = await storyReportService.getAll(targetPage, PAGE_SIZE);
        setReports((previous) => (replace ? response.items : [...previous, ...response.items]));
        setHasMore(response.hasMore);
        setPage(targetPage);
        setLoadError(null);
      } catch (error) {
        setLoadError(getApiErrorMessage(error, tx('Không thể tải danh sách báo cáo story.', 'Could not load story reports.')));
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
      const updated = await storyReportService.resolve(reportId, status);
      setReports((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        status === 'RESOLVED'
          ? tx('Đã duyệt báo cáo story và xóa story vi phạm.', 'Story report approved and story removed.')
          : tx('Đã từ chối báo cáo story.', 'Story report rejected.'),
        'success',
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Xử lý báo cáo story thất bại.', 'Failed to process story report.')), 'error');
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
    approveConfirmReport,
    setApproveConfirmReport,
    loadReports,
    resolveReport,
    toast,
  };
};

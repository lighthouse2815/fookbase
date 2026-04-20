import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useCornerToast } from '@/hooks/useCornerToast';
import { useLocaleText } from '@/hooks/useLocaleText';
import type { Post } from '@/interface/post';
import type { PostReportItem, ReportUserSummary } from '@/interface/report';
import { postService } from '@/services/post/postService';
import { postReportService } from '@/services/post/postReportService';
import { getApiErrorMessage } from '@/utils/apiError';
import { PAGE_SIZE } from '../reportUtils';

export type PostReportListItem = PostReportItem & {
  postOwnerUserId?: string | null;
  reporter?: ReportUserSummary | null;
  postOwner?: ReportUserSummary | null;
};

interface ReportedPostPreviewState {
  isLoading: boolean;
  post: Post | null;
  error: string | null;
}

export const useReportPost = () => {
  const { user } = useAuth();
  const tx = useLocaleText();
  const [reports, setReports] = useState<PostReportListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingActionReportId, setPendingActionReportId] = useState<string | null>(null);
  const [approveConfirmReportId, setApproveConfirmReportId] = useState<string | null>(null);
  const [postPreviewByPostId, setPostPreviewByPostId] = useState<Record<string, ReportedPostPreviewState>>({});
  const loadingRef = useRef(false);
  const { toast, showToast } = useCornerToast();

  const loadPostPreviews = useCallback(
    async (items: PostReportListItem[]) => {
      const nextPostIds = Array.from(
        new Set(
          items
            .map((item) => item.postId?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      );

      if (nextPostIds.length === 0) {
        return;
      }

      let postIdsToFetch: string[] = [];
      setPostPreviewByPostId((previous) => {
        const next = { ...previous };
        postIdsToFetch = nextPostIds.filter((postId) => !next[postId]);

        postIdsToFetch.forEach((postId) => {
          next[postId] = {
            isLoading: true,
            post: null,
            error: null,
          };
        });

        return next;
      });

      if (postIdsToFetch.length === 0) {
        return;
      }

      const results = await Promise.allSettled(postIdsToFetch.map((postId) => postService.getPostById(postId)));

      setPostPreviewByPostId((previous) => {
        const next = { ...previous };

        results.forEach((result, index) => {
          const postId = postIdsToFetch[index];
          if (result.status === 'fulfilled') {
            next[postId] = {
              isLoading: false,
              post: result.value,
              error: null,
            };
            return;
          }

          next[postId] = {
            isLoading: false,
            post: null,
            error: getApiErrorMessage(
              result.reason,
              tx('Khong the tai noi dung bai viet bi bao cao.', 'Unable to load reported post content.'),
            ),
          };
        });

        return next;
      });
    },
    [tx],
  );

  const loadReports = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);

      try {
        const response = await postReportService.getAll(targetPage, PAGE_SIZE);
        const items = response.items as PostReportListItem[];
        setReports((previous) => (replace ? items : [...previous, ...items]));
        setHasMore(response.hasMore);
        setPage(targetPage);
        setLoadError(null);
        await loadPostPreviews(items);
      } catch (error) {
        setLoadError(getApiErrorMessage(error, tx('Khong the tai danh sach bao cao bai dang.', 'Could not load post reports.')));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [loadPostPreviews, tx],
  );

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    if (pendingActionReportId) {
      return;
    }

    const targetPostId = reports.find((item) => item.id === reportId)?.postId;
    setPendingActionReportId(reportId);

    try {
      const updated = await postReportService.resolve(reportId, status);
      setReports((previous) => previous.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));

      if (status === 'RESOLVED' && targetPostId) {
        setPostPreviewByPostId((previous) => ({
          ...previous,
          [targetPostId]: {
            isLoading: false,
            post: null,
            error: tx('Bai viet da duoc xoa sau khi duyet bao cao.', 'The post was removed after report approval.'),
          },
        }));
      }

      showToast(
        status === 'RESOLVED'
          ? tx('Da duyet bao cao bai dang.', 'Post report approved.')
          : tx('Da tu choi bao cao bai dang.', 'Post report rejected.'),
        'success',
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, tx('Xu ly bao cao bai dang that bai.', 'Failed to process post report.')), 'error');
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
    currentUser: user,
    postPreviewByPostId,
  };
};

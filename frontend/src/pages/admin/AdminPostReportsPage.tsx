import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { CornerToast } from '../../components/CornerToast';
import { useCornerToast } from '../../hooks/useCornerToast';
import { postReportService } from '../../services/postReportService';
import type { PostReportItem } from '../../types/report';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatRelativeTime } from '../../utils/date';
import { getStatusBadgeClass, isCommentReportReason, PAGE_SIZE } from './reportUtils';

export const AdminPostReportsPage = () => {
  const [reports, setReports] = useState<PostReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingActionReportId, setPendingActionReportId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const { toast, showToast } = useCornerToast();

  const loadReports = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await postReportService.getAll(targetPage, PAGE_SIZE);
      const postReportsOnly = response.items.filter((item) => !isCommentReportReason(item.reason));

      setReports((previous) => (replace ? postReportsOnly : [...previous, ...postReportsOnly]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Khong the tai danh sach bao cao bai dang.'));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    if (pendingActionReportId) {
      return;
    }

    setPendingActionReportId(reportId);

    try {
      const updated = await postReportService.resolve(reportId, status);
      setReports((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      showToast(status === 'RESOLVED' ? 'Da duyet bao cao bai dang.' : 'Da tu choi bao cao bai dang.', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Xu ly bao cao bai dang that bai.'), 'error');
    } finally {
      setPendingActionReportId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Duyet bao cao bai dang</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Quan ly cac report lien quan den bai dang.
        </p>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      {reports.length === 0 && !isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          Chua co bao cao bai dang nao can xu ly.
        </section>
      ) : null}

      <section className="space-y-3">
        {reports.map((report) => {
          const normalizedStatus = report.status.trim().toUpperCase();
          const isPending = normalizedStatus === 'PENDING';
          const isActing = pendingActionReportId === report.id;

          return (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Report #{report.id.slice(0, 8)}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.reason}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Reporter: {report.reportedByUserId} - {formatRelativeTime(report.createdAt)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to={`/posts/${report.postId}`}
                  className="inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Xem bai viet
                </Link>

                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void resolveReport(report.id, 'RESOLVED')}
                      disabled={isActing}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActing ? 'Dang xu ly...' : 'Chap nhan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveReport(report.id, 'REJECTED')}
                      disabled={isActing}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Tu choi
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadReports(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? 'Dang tai...' : 'Xem them'}
          </button>
        ) : reports.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Da hien thi het bao cao.</p>
        ) : null}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

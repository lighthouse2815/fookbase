import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { postReportService } from '../services/postReportService';
import type { PostReportItem } from '../types/report';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';

const PAGE_SIZE = 10;

const getStatusBadgeClass = (status: string) => {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'RESOLVED') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }

  if (normalized === 'REJECTED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
};

export const ReportedPostsPage = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<PostReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadReports = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await postReportService.getMine(targetPage, PAGE_SIZE);
      setReports((previous) => (replace ? response.items : [...previous, ...response.items]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, t('reportedPosts.loadError')));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('reportedPosts.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.subtitle')}</p>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      {reports.length === 0 && !isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          {t('reportedPosts.empty')}
        </section>
      ) : null}

      <section className="space-y-3">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('reportedPosts.reportLabel', { id: report.id.slice(0, 8) })}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(report.status)}`}>
                {report.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.reason}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>

            <Link
              to={`/posts/${report.postId}`}
              className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('reportedPosts.viewPost')}
            </Link>
          </article>
        ))}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadReports(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? t('reportedPosts.loadingButton') : t('reportedPosts.loadMoreButton')}
          </button>
        ) : reports.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.noMoreReports')}</p>
        ) : null}
      </div>
    </div>
  );
};

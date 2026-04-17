import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyStateCard } from '@/components/EmptyStateCard';
import { useLocaleText } from '@/hooks/useLocaleText';
import type { AdminAuditLogItem } from '@/interface/admin';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatRelativeTime } from '@/utils/date';
import { PAGE_SIZE } from './reportUtils';

export const AdminAuditLogsPage = () => {
  const tx = useLocaleText();
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadLogs = useCallback(async (targetPage: number, replace = false) => {
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
  }, [tx]);

  useEffect(() => {
    void loadLogs(1, true);
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Lịch sử thao tác admin', 'Admin audit logs')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Lưu vết ai duyệt, duyệt gì, đổi trạng thái gì và thời gian thực hiện.',
            'Track who moderated what, which action was taken, and when.',
          )}
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {errorMessage}
        </section>
      ) : null}

      {logs.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={ShieldCheck}
          title={tx('Chưa có bản ghi lịch sử', 'No audit logs yet')}
          description={tx(
            'Các hành động duyệt của admin sẽ được lưu và hiển thị tại đây.',
            'Admin moderation actions will be stored and shown here.',
          )}
          actionLabel={tx('Làm mới', 'Refresh')}
          onAction={() => {
            void loadLogs(1, true);
          }}
        />
      ) : null}

      <section className="space-y-3">
        {logs.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {item.actionType}
              </span>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {item.entityType}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(item.createdAt)}</p>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <p>
                {tx('Admin', 'Admin')}:{' '}
                <Link to={`/profile/${item.adminUserId}`} className="font-semibold text-brand-600 hover:text-brand-700">
                  {item.adminUserId}
                </Link>
              </p>
              <p>
                {tx('Target', 'Target')}:{' '}
                {item.targetUserId ? (
                  <Link to={`/profile/${item.targetUserId}`} className="font-semibold text-brand-600 hover:text-brand-700">
                    {item.targetUserId}
                  </Link>
                ) : (
                  tx('Không có', 'N/A')
                )}
              </p>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              EntityId: {item.entityId ?? tx('Không có', 'N/A')}
            </p>
            {item.details ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.details}</p> : null}
          </article>
        ))}
      </section>

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadLogs(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? tx('Đang tải...', 'Loading...') : tx('Xem thêm', 'Load more')}
          </button>
        ) : logs.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{tx('Đã hiển thị hết lịch sử.', 'All logs are shown.')}</p>
        ) : null}
      </div>
    </div>
  );
};

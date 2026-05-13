import { Link } from 'react-router-dom';
import { AlertTriangle, MessageSquareWarning } from 'lucide-react';

import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { EmptyStateCard } from '@/shared/ui/feedback/EmptyStateCard';
import { formatRelativeTime } from '@/shared/lib/date';
import { useAdminCommentReportsPage } from '@/features/admin/hooks/useAdminCommentReportsPage';
import { getAdminReportStatusBadgeClass } from '@/features/admin/utils/report.util';
import { DEFAULT_ADMIN_AVATAR_URL } from '@/features/admin/utils/user.util';

export const AdminCommentReportsPage = () => {
  const {
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
  } = useAdminCommentReportsPage();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Duyệt báo cáo bình luận', 'Moderate comment reports')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx('Quản lý các report liên quan đến bình luận.', 'Review reports related to comments.')}
        </p>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      {reports.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={MessageSquareWarning}
          title={tx('Chưa có báo cáo bình luận', 'No comment reports')}
          description={tx(
            'Danh sách đang trống. Báo cáo mới sẽ hiển thị ở đây.',
            'The list is empty. New reports will appear here.',
          )}
          actionLabel={tx('Làm mới', 'Refresh')}
          onAction={() => {
            void loadReports(1, true);
          }}
        />
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
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAdminReportStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.reason}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Người báo cáo', 'Reporter')}</p>
                  {report.reporter ? (
                    <Link to={`/profile/${report.reporter.id}`} className="mt-2 flex items-center gap-2">
                      <img
                        src={report.reporter.avatarUrl || DEFAULT_ADMIN_AVATAR_URL}
                        alt={report.reporter.displayName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{report.reporter.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{report.reportedByUserId}</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{report.reportedByUserId}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Người bị báo cáo', 'Reported user')}</p>
                  {report.commentOwner ? (
                    <Link to={`/profile/${report.commentOwner.id}`} className="mt-2 flex items-center gap-2">
                      <img
                        src={report.commentOwner.avatarUrl || DEFAULT_ADMIN_AVATAR_URL}
                        alt={report.commentOwner.displayName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{report.commentOwner.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{report.commentOwnerUserId ?? 'N/A'}</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{report.commentOwnerUserId ?? 'N/A'}</p>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {tx('Bình luận', 'Comment')}: {report.commentId} - {formatRelativeTime(report.createdAt)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  to={`/posts/${report.postId}`}
                  className="inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {tx('Xem post gốc', 'View parent post')}
                </Link>

                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setApproveConfirmReportId(report.id)}
                      disabled={isActing}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActing ? tx('Đang xử lý...', 'Processing...') : tx('Chấp nhận', 'Approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveReport(report.id, 'REJECTED')}
                      disabled={isActing}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {tx('Từ chối', 'Reject')}
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
            {isLoading ? tx('Đang tải...', 'Loading...') : tx('Xem thêm', 'Load more')}
          </button>
        ) : reports.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{tx('Đã hiển thị hết báo cáo.', 'All reports are shown.')}</p>
        ) : null}
      </div>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />

      {approveConfirmReportId ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/70" onClick={() => setApproveConfirmReportId(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Xác nhận duyệt báo cáo', 'Confirm approval')}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {tx(
                    'Chấp nhận report nghĩa là bình luận bị báo cáo sẽ bị xóa. Bạn chắc chắn tiếp tục?',
                    'Approving this report means the reported comment will be deleted. Continue?',
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveConfirmReportId(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {tx('Hủy', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void resolveReport(approveConfirmReportId, 'RESOLVED');
                  setApproveConfirmReportId(null);
                }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {tx('Xác nhận duyệt', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};



import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing } from 'lucide-react';

import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { EmptyStateCard } from '@/shared/ui/feedback/EmptyStateCard';
import { formatRelativeTime } from '@/shared/lib/date';
import { useAdminStoryReportsPage } from '@/features/admin/hooks/useAdminStoryReportsPage';
import { getAdminReportStatusBadgeClass } from '@/features/admin/utils/report.util';
import { DEFAULT_ADMIN_AVATAR_URL } from '@/features/admin/utils/user.util';

export const AdminStoryReportsPage = () => {
  const {
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
  } = useAdminStoryReportsPage();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Duyet bao cao story', 'Moderate story reports')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Neu chap nhan report, story bi bao cao se bi xoa khoi he thong.',
            'If approved, the reported story will be removed from the system.',
          )}
        </p>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      {reports.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={BellRing}
          title={tx('Chua co bao cao story', 'No story reports')}
          description={tx(
            'Danh sach dang trong. Bao cao story moi se hien thi tai day.',
            'The list is empty. New story reports will appear here.',
          )}
          actionLabel={tx('Lam moi', 'Refresh')}
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

          const reporter = report.reporter;
          const owner = report.storyOwner;

          return (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Story report #{report.id.slice(0, 8)}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getAdminReportStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.reason}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Nguoi bao cao', 'Reporter')}</p>
                  {reporter ? (
                    <Link to={`/profile/${reporter.id}`} className="mt-2 flex items-center gap-2">
                      <img
                        src={reporter.avatarUrl || DEFAULT_ADMIN_AVATAR_URL}
                        alt={reporter.displayName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{reporter.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{reporter.id}</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{report.reportedByUserId}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{tx('Nguoi dang story', 'Story owner')}</p>
                  {owner ? (
                    <Link to={`/profile/${owner.id}`} className="mt-2 flex items-center gap-2">
                      <img src={owner.avatarUrl || DEFAULT_ADMIN_AVATAR_URL} alt={owner.displayName} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{owner.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{owner.id}</p>
                      </div>
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{report.storyOwnerUserId ?? 'N/A'}</p>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>

              {isPending ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveConfirmReport(report)}
                    disabled={isActing}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActing ? tx('Dang xu ly...', 'Processing...') : tx('Chap nhan va xoa story', 'Approve and remove story')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveReport(report.id, 'REJECTED')}
                    disabled={isActing}
                    className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tx('Tu choi', 'Reject')}
                  </button>
                </div>
              ) : null}
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
            {isLoading ? tx('Dang tai...', 'Loading...') : tx('Xem them', 'Load more')}
          </button>
        ) : reports.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{tx('Da hien thi het bao cao.', 'All reports are shown.')}</p>
        ) : null}
      </div>

      {approveConfirmReport ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/70" onClick={() => setApproveConfirmReport(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Xac nhan duyet bao cao story', 'Confirm story report approval')}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {tx(
                    'Chap nhan se xoa story bi bao cao va gui thong bao den cac ben lien quan. Ban chac chan tiep tuc?',
                    'Approving will remove the reported story and notify related users. Continue?',
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveConfirmReport(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {tx('Huy', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void resolveReport(approveConfirmReport.id, 'RESOLVED');
                  setApproveConfirmReport(null);
                }}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {tx('Xac nhan duyet', 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

import { FileWarning } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyStateCard } from '@/components/EmptyStateCard';
import type {
  PostReportItem,
  ReportUserSummary,
  StoryReportItem,
  UserReportItem,
} from '@/interface/report';
import { formatRelativeTime } from '@/utils/date';

import { useReportedPage } from './hooks/useReportedPage';
import type { ReportedPostsTabId } from './interface';
import { getReportStatusBadgeClass } from './util';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

export const ReportedPostsPage = () => {
  const {
    t,
    activeTab,
    setActiveTab,
    reports,
    page,
    hasMore,
    isLoading,
    loadError,
    loadReports,
  } = useReportedPage();

  const tabItems: Array<{ id: ReportedPostsTabId; label: string }> = [
    { id: 'post', label: t('reportedPosts.tabs.post') },
    { id: 'story', label: t('reportedPosts.tabs.story') },
    { id: 'user', label: t('reportedPosts.tabs.user') },
  ];
  const postReports = activeTab === 'post' ? (reports as PostReportItem[]) : [];
  const storyReports = activeTab === 'story' ? (reports as StoryReportItem[]) : [];
  const userReports = activeTab === 'user' ? (reports as UserReportItem[]) : [];
  const activeReports = activeTab === 'post'
    ? postReports
    : activeTab === 'story'
      ? storyReports
      : userReports;

  const renderReportedUserCard = (reportedUser?: ReportUserSummary | null, fallbackUserId?: string | null) => (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{t('reportedPosts.reportedUser')}</p>
      {reportedUser ? (
        <Link to={`/profile/${reportedUser.id}`} className="mt-2 flex items-center gap-3">
          <img
            src={reportedUser.avatarUrl || DEFAULT_AVATAR_URL}
            alt={reportedUser.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{reportedUser.displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{fallbackUserId ?? reportedUser.id}</p>
          </div>
        </Link>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.unknownUser')}</p>
          {fallbackUserId ? <p className="text-xs text-slate-500 dark:text-slate-400">{fallbackUserId}</p> : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('reportedPosts.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.subtitle')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabItems.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? 'rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {loadError}
        </section>
      ) : null}

      {activeReports.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={FileWarning}
          title={t('reportedPosts.emptyTitle')}
          description={t('reportedPosts.emptyDescription')}
          actionLabel={t('reportedPosts.refresh')}
          onAction={() => {
            void loadReports(1, true);
          }}
        />
      ) : null}

      <section className="space-y-3">
        {activeTab === 'post'
          ? postReports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('reportedPosts.reportLabel', { id: report.id.slice(0, 8) })}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getReportStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
              </div>

              {renderReportedUserCard(report.postOwner, report.postOwnerUserId)}

              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">{t('reportedPosts.reasonLabel')}</span> {report.reason}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">{t('reportedPosts.reportedAtLabel')}</span> {formatRelativeTime(report.createdAt)}
              </p>

              <Link
                to={`/posts/${report.postId}`}
                className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('reportedPosts.viewPost')}
              </Link>
            </article>
          ))
          : null}

        {activeTab === 'story'
          ? storyReports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('reportedPosts.reportLabel', { id: report.id.slice(0, 8) })}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getReportStatusBadgeClass(report.status)}`}>
                  {report.status}
                </span>
              </div>

              {renderReportedUserCard(report.storyOwner, report.storyOwnerUserId)}

              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">{t('reportedPosts.reasonLabel')}</span> {report.reason}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">{t('reportedPosts.reportedAtLabel')}</span> {formatRelativeTime(report.createdAt)}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('reportedPosts.storyIdLabel', { id: report.storyId })}
              </p>
            </article>
          ))
          : null}

        {activeTab === 'user'
          ? userReports.map((report) => {
            const targetUserId = report.targetUser?.id ?? report.targetUserId;
            return (
              <article
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t('reportedPosts.reportLabel', { id: report.id.slice(0, 8) })}
                  </p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getReportStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                {renderReportedUserCard(report.targetUser, report.targetUserId)}

                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{t('reportedPosts.reasonLabel')}</span> {report.reason}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">{t('reportedPosts.reportedAtLabel')}</span> {formatRelativeTime(report.createdAt)}
                </p>

                {targetUserId ? (
                  <Link
                    to={`/profile/${targetUserId}`}
                    className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t('reportedPosts.viewProfile')}
                  </Link>
                ) : null}
              </article>
            );
          })
          : null}
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
        ) : activeReports.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.noMoreReports')}</p>
        ) : null}
      </div>
    </div>
  );
};

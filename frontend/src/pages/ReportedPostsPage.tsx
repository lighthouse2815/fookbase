import clsx from 'clsx';
import { FileWarning, Flag, MessageSquareWarning, UserRound, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EmptyStateCard } from '../components/EmptyStateCard';
import { postReportService } from '../services/postReportService';
import { storyReportService } from '../services/storyReportService';
import { userReportService } from '../services/userReportService';
import type { PostReportItem, ReportUserSummary, StoryReportItem, UserReportItem } from '../types/report';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRelativeTime } from '../utils/date';

const PAGE_SIZE = 10;

const COMMENT_REPORT_PATTERN = /\[COMMENT:([^\]]+)\]/i;

const isCommentReportReason = (reason: string) => COMMENT_REPORT_PATTERN.test(reason.trim());

const extractCommentIdFromReason = (reason: string): string | null => {
  const match = reason.match(COMMENT_REPORT_PATTERN);
  return match?.[1]?.trim() || null;
};

const normalizeCommentReason = (reason: string) => {
  const cleaned = reason.replace(COMMENT_REPORT_PATTERN, '').trim();
  return cleaned.length > 0 ? cleaned : reason;
};

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

const resolveAvatar = (userId: string | null | undefined, user: ReportUserSummary | null | undefined) => {
  if (user?.avatarUrl && user.avatarUrl.trim().length > 0) {
    return user.avatarUrl;
  }

  return `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.id ?? userId ?? 'report-user')}`;
};

type ReportTabId = 'user' | 'post' | 'comment' | 'story';

interface ReportTabState<T> {
  items: T[];
  nextPage: number;
  hasMore: boolean;
  isLoading: boolean;
  loadError: string | null;
  initialized: boolean;
}

const createInitialState = <T,>(): ReportTabState<T> => ({
  items: [],
  nextPage: 1,
  hasMore: true,
  isLoading: false,
  loadError: null,
  initialized: false,
});

const REPORT_TABS: Array<{ id: ReportTabId; labelKey: string; icon: LucideIcon }> = [
  { id: 'user', labelKey: 'reportedPosts.tabs.user', icon: UserRound },
  { id: 'post', labelKey: 'reportedPosts.tabs.post', icon: FileWarning },
  { id: 'comment', labelKey: 'reportedPosts.tabs.comment', icon: MessageSquareWarning },
  { id: 'story', labelKey: 'reportedPosts.tabs.story', icon: Flag },
];

export const ReportedPostsPage = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ReportTabId>('user');
  const [userState, setUserState] = useState<ReportTabState<UserReportItem>>(() => createInitialState<UserReportItem>());
  const [postState, setPostState] = useState<ReportTabState<PostReportItem>>(() => createInitialState<PostReportItem>());
  const [commentState, setCommentState] = useState<ReportTabState<PostReportItem>>(() => createInitialState<PostReportItem>());
  const [storyState, setStoryState] = useState<ReportTabState<StoryReportItem>>(() => createInitialState<StoryReportItem>());

  const userLoadingRef = useRef(false);
  const postLoadingRef = useRef(false);
  const commentLoadingRef = useRef(false);
  const storyLoadingRef = useRef(false);

  const fetchFilteredPostReports = useCallback(
    async (startPage: number, predicate: (item: PostReportItem) => boolean) => {
      let cursorPage = startPage;
      let hasMore = true;
      const filteredItems: PostReportItem[] = [];

      while (hasMore && filteredItems.length === 0) {
        const response = await postReportService.getMine(cursorPage, PAGE_SIZE);
        filteredItems.push(...response.items.filter(predicate));
        hasMore = response.hasMore;
        cursorPage = response.page + 1;
      }

      return {
        items: filteredItems,
        nextPage: cursorPage,
        hasMore,
      };
    },
    [],
  );

  const loadUserReports = useCallback(
    async (replace = false) => {
      if (userLoadingRef.current) {
        return;
      }

      userLoadingRef.current = true;
      setUserState((previous) => ({ ...previous, isLoading: true }));
      const pageToLoad = replace ? 1 : userState.nextPage;

      try {
        const response = await userReportService.getMine(pageToLoad, PAGE_SIZE);
        setUserState((previous) => ({
          ...previous,
          items: replace ? response.items : [...previous.items, ...response.items],
          nextPage: response.page + 1,
          hasMore: response.hasMore,
          isLoading: false,
          loadError: null,
          initialized: true,
        }));
      } catch (error) {
        setUserState((previous) => ({
          ...previous,
          isLoading: false,
          loadError: getApiErrorMessage(error, t('reportedPosts.loadError')),
          initialized: true,
        }));
      } finally {
        userLoadingRef.current = false;
      }
    },
    [t, userState.nextPage],
  );

  const loadPostReports = useCallback(
    async (replace = false) => {
      if (postLoadingRef.current) {
        return;
      }

      postLoadingRef.current = true;
      setPostState((previous) => ({ ...previous, isLoading: true }));
      const pageToLoad = replace ? 1 : postState.nextPage;

      try {
        const response = await fetchFilteredPostReports(pageToLoad, (item) => !isCommentReportReason(item.reason));
        setPostState((previous) => ({
          ...previous,
          items: replace ? response.items : [...previous.items, ...response.items],
          nextPage: response.nextPage,
          hasMore: response.hasMore,
          isLoading: false,
          loadError: null,
          initialized: true,
        }));
      } catch (error) {
        setPostState((previous) => ({
          ...previous,
          isLoading: false,
          loadError: getApiErrorMessage(error, t('reportedPosts.loadError')),
          initialized: true,
        }));
      } finally {
        postLoadingRef.current = false;
      }
    },
    [fetchFilteredPostReports, postState.nextPage, t],
  );

  const loadCommentReports = useCallback(
    async (replace = false) => {
      if (commentLoadingRef.current) {
        return;
      }

      commentLoadingRef.current = true;
      setCommentState((previous) => ({ ...previous, isLoading: true }));
      const pageToLoad = replace ? 1 : commentState.nextPage;

      try {
        const response = await fetchFilteredPostReports(pageToLoad, (item) => isCommentReportReason(item.reason));
        setCommentState((previous) => ({
          ...previous,
          items: replace ? response.items : [...previous.items, ...response.items],
          nextPage: response.nextPage,
          hasMore: response.hasMore,
          isLoading: false,
          loadError: null,
          initialized: true,
        }));
      } catch (error) {
        setCommentState((previous) => ({
          ...previous,
          isLoading: false,
          loadError: getApiErrorMessage(error, t('reportedPosts.loadError')),
          initialized: true,
        }));
      } finally {
        commentLoadingRef.current = false;
      }
    },
    [commentState.nextPage, fetchFilteredPostReports, t],
  );

  const loadStoryReports = useCallback(
    async (replace = false) => {
      if (storyLoadingRef.current) {
        return;
      }

      storyLoadingRef.current = true;
      setStoryState((previous) => ({ ...previous, isLoading: true }));
      const pageToLoad = replace ? 1 : storyState.nextPage;

      try {
        const response = await storyReportService.getMine(pageToLoad, PAGE_SIZE);
        setStoryState((previous) => ({
          ...previous,
          items: replace ? response.items : [...previous.items, ...response.items],
          nextPage: response.page + 1,
          hasMore: response.hasMore,
          isLoading: false,
          loadError: null,
          initialized: true,
        }));
      } catch (error) {
        setStoryState((previous) => ({
          ...previous,
          isLoading: false,
          loadError: getApiErrorMessage(error, t('reportedPosts.loadError')),
          initialized: true,
        }));
      } finally {
        storyLoadingRef.current = false;
      }
    },
    [storyState.nextPage, t],
  );

  useEffect(() => {
    if (activeTab === 'user' && !userState.initialized) {
      void loadUserReports(true);
    }

    if (activeTab === 'post' && !postState.initialized) {
      void loadPostReports(true);
    }

    if (activeTab === 'comment' && !commentState.initialized) {
      void loadCommentReports(true);
    }

    if (activeTab === 'story' && !storyState.initialized) {
      void loadStoryReports(true);
    }
  }, [
    activeTab,
    commentState.initialized,
    loadCommentReports,
    loadPostReports,
    loadStoryReports,
    loadUserReports,
    postState.initialized,
    storyState.initialized,
    userState.initialized,
  ]);

  const loadMoreActiveTab = () => {
    if (activeTab === 'user') {
      void loadUserReports();
      return;
    }

    if (activeTab === 'post') {
      void loadPostReports();
      return;
    }

    if (activeTab === 'comment') {
      void loadCommentReports();
      return;
    }

    void loadStoryReports();
  };

  const refreshActiveTab = () => {
    if (activeTab === 'user') {
      void loadUserReports(true);
      return;
    }

    if (activeTab === 'post') {
      void loadPostReports(true);
      return;
    }

    if (activeTab === 'comment') {
      void loadCommentReports(true);
      return;
    }

    void loadStoryReports(true);
  };

  const activeLoadError =
    activeTab === 'user'
      ? userState.loadError
      : activeTab === 'post'
        ? postState.loadError
        : activeTab === 'comment'
          ? commentState.loadError
          : storyState.loadError;

  const activeHasMore =
    activeTab === 'user'
      ? userState.hasMore
      : activeTab === 'post'
        ? postState.hasMore
        : activeTab === 'comment'
          ? commentState.hasMore
          : storyState.hasMore;

  const activeIsLoading =
    activeTab === 'user'
      ? userState.isLoading
      : activeTab === 'post'
        ? postState.isLoading
        : activeTab === 'comment'
          ? commentState.isLoading
          : storyState.isLoading;

  const activeItemCount =
    activeTab === 'user'
      ? userState.items.length
      : activeTab === 'post'
        ? postState.items.length
        : activeTab === 'comment'
          ? commentState.items.length
          : storyState.items.length;

  const activeEmptyIcon =
    activeTab === 'user'
      ? UserRound
      : activeTab === 'post'
        ? FileWarning
        : activeTab === 'comment'
          ? MessageSquareWarning
          : Flag;

  const renderUserSummary = (
    label: string,
    userId: string | null | undefined,
    user: ReportUserSummary | null | undefined,
  ) => {
    if (user) {
      return (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
          <Link to={`/profile/${user.id}`} className="mt-2 flex items-center gap-2">
            <img
              src={resolveAvatar(userId, user)}
              alt={user.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{userId ?? user.id}</p>
            </div>
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{userId ?? t('reportedPosts.unknownUser')}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('reportedPosts.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.subtitle')}</p>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            const itemCount =
              tab.id === 'user'
                ? userState.items.length
                : tab.id === 'post'
                  ? postState.items.length
                  : tab.id === 'comment'
                    ? commentState.items.length
                    : storyState.items.length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  isActive
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                    : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100',
                )}
              >
                <Icon size={14} />
                {t(tab.labelKey)}
                <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {itemCount}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeLoadError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {activeLoadError}
        </section>
      ) : null}

      {activeItemCount === 0 && !activeIsLoading ? (
        <EmptyStateCard
          icon={activeEmptyIcon}
          title={t('reportedPosts.emptyTitle')}
          description={t('reportedPosts.emptyDescription')}
          actionLabel={t('reportedPosts.refresh')}
          onAction={refreshActiveTab}
        />
      ) : null}

      <section className="space-y-3">
        {activeTab === 'user'
          ? userState.items.map((report) => (
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {renderUserSummary(t('reportedPosts.reporter'), report.reportedByUserId, report.reporter)}
                {renderUserSummary(t('reportedPosts.reportedUser'), report.targetUserId, report.targetUser)}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>

              <Link
                to={`/profile/${report.targetUserId}`}
                className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('reportedPosts.viewProfile')}
              </Link>
            </article>
          ))
          : null}

        {activeTab === 'post'
          ? postState.items.map((report) => (
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {renderUserSummary(t('reportedPosts.reporter'), report.reportedByUserId, report.reporter)}
                {renderUserSummary(t('reportedPosts.reportedUser'), report.postOwnerUserId, report.postOwner)}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>

              <Link
                to={`/posts/${report.postId}`}
                className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('reportedPosts.viewPost')}
              </Link>
            </article>
          ))
          : null}

        {activeTab === 'comment'
          ? commentState.items.map((report) => {
            const commentId = extractCommentIdFromReason(report.reason);

            return (
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

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{normalizeCommentReason(report.reason)}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {renderUserSummary(t('reportedPosts.reporter'), report.reportedByUserId, report.reporter)}
                  {renderUserSummary(t('reportedPosts.reportedUser'), report.postOwnerUserId, report.postOwner)}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t('reportedPosts.commentIdLabel', { id: commentId ?? 'N/A' })}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>

                <Link
                  to={`/posts/${report.postId}`}
                  className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('reportedPosts.viewPost')}
                </Link>
              </article>
            );
          })
          : null}

        {activeTab === 'story'
          ? storyState.items.map((report) => (
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {renderUserSummary(t('reportedPosts.reporter'), report.reportedByUserId, report.reporter)}
                {renderUserSummary(t('reportedPosts.reportedUser'), report.storyOwnerUserId, report.storyOwner)}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('reportedPosts.storyIdLabel', { id: report.storyId })}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(report.createdAt)}</p>
            </article>
          ))
          : null}
      </section>

      <div className="flex justify-center pb-2">
        {activeHasMore ? (
          <button
            type="button"
            onClick={loadMoreActiveTab}
            disabled={activeIsLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {activeIsLoading ? t('reportedPosts.loadingButton') : t('reportedPosts.loadMoreButton')}
          </button>
        ) : activeItemCount > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reportedPosts.noMoreReports')}</p>
        ) : null}
      </div>
    </div>
  );
};

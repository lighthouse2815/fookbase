import { Hash } from 'lucide-react';

import { EmptyStateCard } from '@/shared/ui/feedback/EmptyStateCard';
import { parseApiDate } from '@/shared/lib/date';
import { useAdminHashtagsPage } from '@/features/admin/hooks/useAdminHashtagsPage';

const resolveMonthLabel = (monthValue: string, locale: string): string => {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
    return '--/----';
  }

  const [yearPart, monthPart] = monthValue.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return '--/----';
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: '2-digit', year: 'numeric' }).format(date);
};

const formatDate = (isoDate: string, locale: string): string => {
  const parsedDate = parseApiDate(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return '--/--/----';
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate);
};

export const AdminHashtagsPage = () => {
  const {
    tx,
    currentMonth,
    topHashtags,
    hashtags,
    page,
    hasMore,
    isLoading,
    errorMessage,
    loadHashtags,
  } = useAdminHashtagsPage();

  const dateLocale = tx('vi-VN', 'en-GB');
  const monthLabel = resolveMonthLabel(currentMonth, dateLocale);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{tx('Thống kê hashtag', 'Hashtag analytics')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Top 3 hashtag phổ biến nhất theo tháng hiện tại và danh sách hashtag phân trang chỉ để xem.',
            'Top 3 most popular hashtags in the current month and a read-only paginated hashtag list.',
          )}
        </p>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-700/60 dark:bg-rose-500/10 dark:text-rose-300">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx('Top 3 trong tháng', 'Top 3 this month')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx('Tháng', 'Month')}: {monthLabel}
          </p>
        </div>

        {topHashtags.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {topHashtags.map((item, index) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  #{index + 1}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">#{item.name}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {item.usageCount} {tx('bài viết', 'posts')}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {tx('Tháng này chưa có hashtag nào được sử dụng.', 'No hashtags were used this month yet.')}
          </p>
        )}
      </section>

      {hashtags.length === 0 && !isLoading ? (
        <EmptyStateCard
          icon={Hash}
          title={tx('Chưa có hashtag', 'No hashtags yet')}
          description={tx(
            'Danh sách hashtag sẽ xuất hiện tại đây khi có bài viết gắn hashtag.',
            'The hashtag list will appear here once posts contain hashtags.',
          )}
          actionLabel={tx('Làm mới', 'Refresh')}
          onAction={() => {
            void loadHashtags(1, true);
          }}
        />
      ) : null}

      {hashtags.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tx('STT', 'No.')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tx('Hashtag', 'Hashtag')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tx('Số bài viết', 'Post count')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {tx('Ngày tạo', 'Created date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hashtags.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">#{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.usageCount}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(item.createdAt, dateLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="flex justify-center pb-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadHashtags(page + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isLoading ? tx('Đang tải...', 'Loading...') : tx('Xem thêm', 'Load more')}
          </button>
        ) : hashtags.length > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{tx('Đã hiển thị hết hashtag.', 'All hashtags are shown.')}</p>
        ) : null}
      </div>
    </div>
  );
};

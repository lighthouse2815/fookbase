import type { AppReviewSummary } from '@/features/appReview/types/contracts';
import { StarRatingDisplay } from '@/features/appReview/components/StarRatingDisplay';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface AppReviewSummaryCardProps {
  summary: AppReviewSummary | null;
  isLoading: boolean;
  error: string | null;
}

export const AppReviewSummaryCard = ({ summary, isLoading, error }: AppReviewSummaryCardProps) => {
  const tx = useLocaleText();

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
        {tx('Đang tải thống kê đánh giá...', 'Loading review summary...')}
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
        {error}
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  const distribution = [
    { label: '5', count: summary.fiveStarCount },
    { label: '4', count: summary.fourStarCount },
    { label: '3', count: summary.threeStarCount },
    { label: '2', count: summary.twoStarCount },
    { label: '1', count: summary.oneStarCount },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {tx('Tổng quan đánh giá', 'Review summary')}
      </h2>

      <div className="mt-3 flex items-end gap-3">
        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {summary.averageRating.toFixed(1)}
          <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">/5</span>
        </p>
        <StarRatingDisplay rating={Math.round(summary.averageRating)} />
      </div>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {tx(`${summary.totalReviews} lượt đánh giá`, `${summary.totalReviews} ratings`)}
      </p>

      <div className="mt-4 space-y-2">
        {distribution.map((item) => {
          const widthPercent = summary.totalReviews > 0 ? (item.count / summary.totalReviews) * 100 : 0;
          return (
            <div key={item.label} className="grid grid-cols-[30px_minmax(0,1fr)_32px] items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}★</span>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-400"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

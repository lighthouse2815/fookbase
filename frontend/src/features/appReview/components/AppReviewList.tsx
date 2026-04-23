import { MessageCircleOff } from 'lucide-react';

import { AppReviewCard } from '@/features/appReview/components/AppReviewCard';
import type { PublicAppReview } from '@/features/appReview/types/contracts';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface AppReviewListProps {
  reviews: PublicAppReview[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
}

export const AppReviewList = ({
  reviews,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onLoadMore,
}: AppReviewListProps) => {
  const tx = useLocaleText();

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
        {tx('Đang tải danh sách đánh giá...', 'Loading app reviews...')}
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

  if (reviews.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <MessageCircleOff size={20} className="mx-auto text-slate-400 dark:text-slate-500" />
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {tx('Chưa có đánh giá nào phù hợp bộ lọc.', 'No reviews match this filter yet.')}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <AppReviewCard key={review.id} review={review} />
      ))}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isLoadingMore ? tx('Đang tải...', 'Loading...') : tx('Xem thêm', 'Load more')}
          </button>
        </div>
      ) : null}
    </div>
  );
};

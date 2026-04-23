import { Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { AppReviewList } from '@/features/appReview/components/AppReviewList';
import { AppReviewSummaryCard } from '@/features/appReview/components/AppReviewSummaryCard';
import { RatingFilter } from '@/features/appReview/components/RatingFilter';
import { useAppReviewSummary } from '@/features/appReview/hooks/useAppReviewSummary';
import { usePublicAppReviews } from '@/features/appReview/hooks/usePublicAppReviews';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

export const PublicAppReviewsPage = () => {
  const tx = useLocaleText();
  const { isAuthenticated } = useAuth();
  const {
    summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useAppReviewSummary();
  const {
    reviews,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    ratingFilter,
    setRatingFilter,
    loadMore,
  } = usePublicAppReviews();

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                <Star size={20} />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {tx('Đánh giá ứng dụng công khai', 'Public app reviews')}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {tx(
                    'Xem nhận xét ẩn danh từ cộng đồng và tổng quan số sao.',
                    'Browse anonymous community feedback and rating summary.',
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RatingFilter
                value={ratingFilter}
                onChange={setRatingFilter}
                allLabel={tx('Tất cả mức sao', 'All ratings')}
              />
              <Link
                to={isAuthenticated ? '/' : '/login'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={15} />
                {isAuthenticated ? tx('Về trang chủ', 'Back to home') : tx('Đăng nhập để đánh giá', 'Sign in to review')}
              </Link>
            </div>
          </div>
        </section>

        <AppReviewSummaryCard summary={summary} isLoading={isSummaryLoading} error={summaryError} />

        <AppReviewList
          reviews={reviews}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={() => {
            void loadMore();
          }}
        />
      </div>
    </div>
  );
};

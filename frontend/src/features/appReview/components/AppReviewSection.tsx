import { MessageSquareQuote } from 'lucide-react';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { AppReviewForm } from '@/features/appReview/components/AppReviewForm';
import { AppReviewList } from '@/features/appReview/components/AppReviewList';
import { AppReviewSummaryCard } from '@/features/appReview/components/AppReviewSummaryCard';
import { RatingFilter } from '@/features/appReview/components/RatingFilter';
import { useAppReviewSummary } from '@/features/appReview/hooks/useAppReviewSummary';
import { useCreateOrUpdateAppReview } from '@/features/appReview/hooks/useCreateOrUpdateAppReview';
import { useDeleteMyAppReview } from '@/features/appReview/hooks/useDeleteMyAppReview';
import { useMyAppReview } from '@/features/appReview/hooks/useMyAppReview';
import { usePublicAppReviews } from '@/features/appReview/hooks/usePublicAppReviews';
import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

export const AppReviewSection = () => {
  const tx = useLocaleText();
  const { isAuthenticated } = useAuth();
  const { toast, showToast } = useCornerToast();
  const { summary, isLoading: isSummaryLoading, error: summaryError, refresh: refreshSummary } = useAppReviewSummary();
  const {
    reviews,
    hasMore,
    isLoading: isReviewsLoading,
    isLoadingMore,
    error: reviewsError,
    ratingFilter,
    setRatingFilter,
    loadMore,
    refresh: refreshPublicReviews,
  } = usePublicAppReviews();
  const {
    myReview,
    isLoading: isMyReviewLoading,
    error: myReviewError,
    setMyReview,
  } = useMyAppReview(isAuthenticated);
  const {
    isSubmitting,
    error: submitError,
    createOrUpdate,
  } = useCreateOrUpdateAppReview();
  const {
    isDeleting,
    error: deleteError,
    deleteMyReview,
  } = useDeleteMyAppReview();

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/65">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <MessageSquareQuote size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {tx('Đánh giá ứng dụng', 'App review')}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tx(
                'Xem tổng quan và gửi đánh giá để nâng cấp trải nghiệm.',
                'View public feedback and send your own review.',
              )}
            </p>
          </div>
        </div>

        <RatingFilter
          value={ratingFilter}
          onChange={setRatingFilter}
          allLabel={tx('Tất cả mức sao', 'All ratings')}
        />
      </header>

      <AppReviewSummaryCard summary={summary} isLoading={isSummaryLoading} error={summaryError} />

      {isAuthenticated ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx('Đánh giá của bạn', 'Your review')}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tx(
              'Mỗi tài khoản chỉ có 1 đánh giá. Gửi lại sẽ cập nhật đánh giá hiện tại.',
              'Each account has one review. Submitting again updates the existing review.',
            )}
          </p>

          {myReviewError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {myReviewError}
            </p>
          ) : null}
          {submitError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {submitError}
            </p>
          ) : null}
          {deleteError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {deleteError}
            </p>
          ) : null}

          {isMyReviewLoading ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {tx('Đang tải đánh giá của bạn...', 'Loading your review...')}
            </p>
          ) : (
            <div className="mt-3">
              <AppReviewForm
                initialReview={myReview}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                submitLabel={myReview ? tx('Cập nhật đánh giá', 'Update review') : tx('Gửi đánh giá', 'Submit review')}
                onSubmit={async (payload) => {
                  const updated = await createOrUpdate(payload);
                  setMyReview(updated);
                  await Promise.all([refreshSummary(), refreshPublicReviews()]);
                  showToast(
                    myReview
                      ? tx('Đã cập nhật đánh giá của bạn.', 'Your review has been updated.')
                      : tx('Đã gửi đánh giá của bạn.', 'Your review has been submitted.'),
                    'success',
                  );
                }}
                onDelete={
                  myReview
                    ? async () => {
                        await deleteMyReview();
                        setMyReview(null);
                        await Promise.all([refreshSummary(), refreshPublicReviews()]);
                        showToast(tx('Đã xóa đánh giá của bạn.', 'Your review has been deleted.'), 'success');
                      }
                    : undefined
                }
              />
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {tx('Đánh giá công khai', 'Public reviews')}
        </h3>
        <AppReviewList
          reviews={reviews}
          isLoading={isReviewsLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={reviewsError}
          onLoadMore={() => {
            void loadMore();
          }}
        />
      </section>

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </section>
  );
};

import { useState } from 'react';

import { AdminAppReviewTable } from '@/features/appReview/components/AdminAppReviewTable';
import { RatingFilter } from '@/features/appReview/components/RatingFilter';
import { useAdminAppReviews } from '@/features/appReview/hooks/useAdminAppReviews';
import { useDeleteAppReview } from '@/features/appReview/hooks/useDeleteAppReview';
import { useHideAppReview } from '@/features/appReview/hooks/useHideAppReview';
import type { AppReview } from '@/features/appReview/types/contracts';
import { useCornerToast } from '@/shared/ui/feedback/useCornerToast';
import { CornerToast } from '@/shared/ui/feedback/CornerToast';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

export const AdminAppReviewsPage = () => {
  const tx = useLocaleText();
  const { toast, showToast } = useCornerToast();
  const {
    reviews,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    filters,
    setRatingFilter,
    setHiddenFilter,
    refresh,
    loadMore,
    updateReview,
    removeReview,
  } = useAdminAppReviews();
  const { isSubmitting: isHideSubmitting, toggleHidden } = useHideAppReview();
  const { isDeleting, deleteReview } = useDeleteAppReview();
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);

  const handleToggleHidden = async (review: AppReview) => {
    setPendingReviewId(review.id);
    try {
      const updated = await toggleHidden(review.id, !review.isHidden);
      updateReview(updated);
      showToast(
        updated.isHidden
          ? tx('Da an review khoi danh sach cong khai.', 'Review is now hidden from public list.')
          : tx('Da bo an review.', 'Review is public again.'),
        'success',
      );
    } catch (toggleError) {
      showToast(
        toggleError instanceof Error
          ? toggleError.message
          : tx('Cap nhat trang thai review that bai.', 'Failed to update review visibility.'),
        'error',
      );
    } finally {
      setPendingReviewId(null);
    }
  };

  const handleDelete = async (review: AppReview) => {
    setPendingReviewId(review.id);
    try {
      await deleteReview(review.id);
      removeReview(review.id);
      showToast(tx('Da xoa review.', 'Review deleted.'), 'success');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : tx('Xoa review that bai.', 'Failed to delete review.'),
        'error',
      );
    } finally {
      setPendingReviewId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {tx('Quan tri app review', 'App review moderation')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tx(
            'Loc, an/hien va xoa review vi pham tren toan he thong.',
            'Filter, hide/unhide, and delete violating app reviews.',
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RatingFilter
            value={filters.rating ?? null}
            onChange={setRatingFilter}
            allLabel={tx('Tat ca muc sao', 'All ratings')}
          />
          <select
            value={filters.isHidden === null ? '' : String(filters.isHidden)}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (!nextValue) {
                setHiddenFilter(null);
                return;
              }

              setHiddenFilter(nextValue === 'true');
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">{tx('Tat ca trang thai', 'All statuses')}</option>
            <option value="false">{tx('Cong khai', 'Public')}</option>
            <option value="true">{tx('Da an', 'Hidden')}</option>
          </select>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {tx('Lam moi', 'Refresh')}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          {tx('Dang tai danh sach review...', 'Loading app reviews...')}
        </section>
      ) : (
        <AdminAppReviewTable
          reviews={reviews}
          pendingReviewId={pendingReviewId}
          onToggleHidden={(review) => {
            void handleToggleHidden(review);
          }}
          onDelete={(review) => {
            void handleDelete(review);
          }}
        />
      )}

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              void loadMore();
            }}
            disabled={isLoadingMore || isHideSubmitting || isDeleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isLoadingMore ? tx('Dang tai...', 'Loading...') : tx('Xem them', 'Load more')}
          </button>
        </div>
      ) : reviews.length > 0 ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          {tx(`Da hien thi ${page} trang review.`, `Displayed ${page} page(s) of reviews.`)}
        </p>
      ) : null}

      <CornerToast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
};

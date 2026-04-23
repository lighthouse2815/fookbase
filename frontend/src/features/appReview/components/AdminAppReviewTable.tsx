import { EyeOff, ShieldCheck, Trash2 } from 'lucide-react';

import { StarRatingDisplay } from '@/features/appReview/components/StarRatingDisplay';
import type { AppReview } from '@/features/appReview/types/contracts';
import { formatRelativeTime } from '@/shared/lib/date';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface AdminAppReviewTableProps {
  reviews: AppReview[];
  pendingReviewId: string | null;
  onToggleHidden: (review: AppReview) => void;
  onDelete: (review: AppReview) => void;
}

export const AdminAppReviewTable = ({
  reviews,
  pendingReviewId,
  onToggleHidden,
  onDelete,
}: AdminAppReviewTableProps) => {
  const tx = useLocaleText();

  if (reviews.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
        {tx('Chưa có đánh giá ứng dụng nào.', 'No app reviews found.')}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Display</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Rating</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Comment</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Time</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.map((review) => {
              const isPending = pendingReviewId === review.id;
              return (
                <tr key={review.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{review.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{review.userId}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <StarRatingDisplay rating={review.rating} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{review.rating}/5</span>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                    <p className="line-clamp-3">{review.comment}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        review.isHidden
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                      }`}
                    >
                      {review.isHidden ? tx('Đã ẩn', 'Hidden') : tx('Công khai', 'Public')}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(review.updatedAt)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleHidden(review)}
                        disabled={isPending}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {review.isHidden ? (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck size={14} />
                            {tx('Bỏ ẩn', 'Unhide')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <EyeOff size={14} />
                            {tx('Ẩn', 'Hide')}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(review)}
                        disabled={isPending}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 size={14} />
                          {tx('Xóa', 'Delete')}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

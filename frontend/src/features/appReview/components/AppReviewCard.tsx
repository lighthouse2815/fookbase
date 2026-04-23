import { MessageSquareText } from 'lucide-react';

import { StarRatingDisplay } from '@/features/appReview/components/StarRatingDisplay';
import type { PublicAppReview } from '@/features/appReview/types/contracts';
import { formatRelativeTime } from '@/shared/lib/date';

interface AppReviewCardProps {
  review: PublicAppReview;
}

export const AppReviewCard = ({ review }: AppReviewCardProps) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{review.displayName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(review.updatedAt)}</p>
        </div>
        <StarRatingDisplay rating={review.rating} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <MessageSquareText size={14} className="mr-1 inline-block align-[-2px] text-brand-500" />
        {review.comment}
      </p>
    </article>
  );
};

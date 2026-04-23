import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  className?: string;
  size?: number;
}

export const StarRatingDisplay = ({ rating, className, size = 16 }: StarRatingDisplayProps) => {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= normalizedRating;

        return (
          <Star
            key={starValue}
            size={size}
            className={isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
            aria-hidden
          />
        );
      })}
    </div>
  );
};

import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  onChange: (nextValue: number) => void;
  disabled?: boolean;
  className?: string;
}

export const StarRatingInput = ({
  value,
  onChange,
  disabled = false,
  className,
}: StarRatingInputProps) => {
  const normalizedValue = Number.isFinite(value) ? value : 0;

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ''}`} role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= normalizedValue;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            disabled={disabled}
            className="rounded-md p-0.5 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            role="radio"
            aria-checked={starValue === normalizedValue}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={20}
              className={isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
            />
          </button>
        );
      })}
    </div>
  );
};

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { StarRatingInput } from '@/features/appReview/components/StarRatingInput';
import type {
  AppReview,
  CreateOrUpdateAppReviewPayload,
} from '@/features/appReview/types/contracts';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface AppReviewFormProps {
  initialReview?: AppReview | null;
  isSubmitting: boolean;
  isDeleting?: boolean;
  submitLabel?: string;
  helperText?: string;
  onSubmit: (payload: CreateOrUpdateAppReviewPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
}

type AppReviewFormValues = {
  rating: number;
  displayName: string;
  comment: string;
};

const toDefaultValues = (initialReview?: AppReview | null): AppReviewFormValues => ({
  rating: initialReview?.rating ?? 0,
  displayName: initialReview?.displayName ?? '',
  comment: initialReview?.comment ?? '',
});

export const AppReviewForm = ({
  initialReview = null,
  isSubmitting,
  isDeleting = false,
  submitLabel,
  helperText,
  onSubmit,
  onDelete,
}: AppReviewFormProps) => {
  const tx = useLocaleText();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppReviewFormValues>({
    defaultValues: toDefaultValues(initialReview),
  });

  useEffect(() => {
    reset(toDefaultValues(initialReview));
  }, [initialReview, reset]);

  const resolvedSubmitLabel = submitLabel ?? tx('Gui danh gia', 'Submit review');

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          rating: values.rating,
          displayName: values.displayName.trim(),
          comment: values.comment.trim(),
        });
      })}
      className="space-y-4"
    >
      {helperText ? <p className="text-sm text-slate-500 dark:text-slate-400">{helperText}</p> : null}

      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {tx('Danh gia sao', 'Rating')}
        <Controller
          control={control}
          name="rating"
          rules={{
            required: tx('Vui long chon so sao.', 'Please select a rating.'),
            min: { value: 1, message: tx('Danh gia toi thieu 1 sao.', 'Minimum rating is 1 star.') },
            max: { value: 5, message: tx('Danh gia toi da 5 sao.', 'Maximum rating is 5 stars.') },
          }}
          render={({ field }) => (
            <StarRatingInput
              value={field.value}
              onChange={(nextValue) => field.onChange(nextValue)}
              disabled={isSubmitting || isDeleting}
              className="mt-2"
            />
          )}
        />
        {errors.rating?.message ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{errors.rating.message}</p>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {tx('Ten hien thi', 'Display name')}
        <input
          {...register('displayName', {
            required: tx('Vui long nhap ten hien thi.', 'Display name is required.'),
            minLength: { value: 2, message: tx('Ten toi thieu 2 ky tu.', 'Display name must be at least 2 characters.') },
            maxLength: { value: 80, message: tx('Ten toi da 80 ky tu.', 'Display name must be at most 80 characters.') },
          })}
          placeholder={tx('Nhap ten hien thi cong khai', 'Public display name')}
          disabled={isSubmitting || isDeleting}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {errors.displayName?.message ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{errors.displayName.message}</p>
        ) : null}
      </label>

      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {tx('Nhan xet', 'Comment')}
        <textarea
          {...register('comment', {
            required: tx('Vui long nhap nhan xet.', 'Comment is required.'),
            minLength: { value: 3, message: tx('Nhan xet toi thieu 3 ky tu.', 'Comment must be at least 3 characters.') },
            maxLength: { value: 1000, message: tx('Nhan xet toi da 1000 ky tu.', 'Comment must be at most 1000 characters.') },
          })}
          rows={4}
          placeholder={tx('Trai nghiem cua ban voi ung dung...', 'Share your experience with this app...')}
          disabled={isSubmitting || isDeleting}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {errors.comment?.message ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{errors.comment.message}</p>
        ) : null}
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              void onDelete();
            }}
            disabled={isSubmitting || isDeleting}
            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
          >
            {isDeleting ? tx('Dang xoa...', 'Deleting...') : tx('Xoa review', 'Delete review')}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting || isDeleting}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? tx('Dang gui...', 'Submitting...') : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  );
};

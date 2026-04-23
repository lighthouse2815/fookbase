import { MessageSquareHeart, X } from 'lucide-react';

import { AppReviewForm } from '@/features/appReview/components/AppReviewForm';
import { useCreateOrUpdateAppReview } from '@/features/appReview/hooks/useCreateOrUpdateAppReview';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { useLocaleText } from '@/shared/i18n/useLocaleText';

interface ReviewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const ReviewPromptModal = ({ isOpen, onClose, onSubmitted }: ReviewPromptModalProps) => {
  const tx = useLocaleText();
  const { isSubmitting, error, createOrUpdate } = useCreateOrUpdateAppReview();

  useBodyScrollLock(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label={tx('Dong popup danh gia', 'Close review prompt')}
      />
      <section className="relative z-[1] w-full max-w-lg rounded-3xl border border-white/20 bg-white/90 p-5 shadow-2xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={tx('Dong popup', 'Close popup')}
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-start gap-3 pr-8">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <MessageSquareHeart size={18} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {tx('Danh gia nhanh ung dung', 'Quick app review')}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tx(
                'Danh gia cua ban giup chung toi cai thien trai nghiem tot hon.',
                'Your feedback helps us improve the product experience.',
              )}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <AppReviewForm
          isSubmitting={isSubmitting}
          submitLabel={tx('Gui danh gia', 'Submit review')}
          helperText={tx('Danh gia se hien thi cong khai o che do an danh.', 'Review will be shown publicly in anonymous mode.')}
          onSubmit={async (payload) => {
            await createOrUpdate(payload);
            onSubmitted();
          }}
        />
      </section>
    </div>
  );
};

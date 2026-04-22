import type { UseCommentReturn } from '@/features/comment/hooks/useComment';

type CommentReportModalProps = Pick<
  UseCommentReturn,
  | 't'
  | 'reportingComment'
  | 'setReportingComment'
  | 'reportReason'
  | 'setReportReason'
  | 'reportReasonError'
  | 'setReportReasonError'
  | 'isReportingComment'
  | 'handleConfirmReportComment'
>;

export const CommentReportModal = ({
  t,
  reportingComment,
  setReportingComment,
  reportReason,
  setReportReason,
  reportReasonError,
  setReportReasonError,
  isReportingComment,
  handleConfirmReportComment,
}: CommentReportModalProps) => {
  if (!reportingComment) {
    return null;
  }

  const handleClose = () => {
    if (isReportingComment) {
      return;
    }

    setReportingComment(null);
    setReportReason('');
    setReportReasonError(null);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        aria-label={t('commentSection.reportModalOverlayAria')}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('commentSection.reportModalTitle')}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('commentSection.reportModalDescription')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t('commentSection.reportReasonLabel')}</label>
            <textarea
              value={reportReason}
              onChange={(event) => {
                setReportReason(event.target.value);
                if (reportReasonError) {
                  setReportReasonError(null);
                }
              }}
              rows={4}
              maxLength={500}
              placeholder={t('commentSection.reportReasonPlaceholder')}
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">{reportReason.length}/500</p>
              {reportReasonError ? <p className="text-xs font-medium text-rose-600">{reportReasonError}</p> : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isReportingComment}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            >
              {t('commentSection.cancel')}
            </button>

            <button
              type="button"
              onClick={() => void handleConfirmReportComment()}
              disabled={isReportingComment}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReportingComment ? t('commentSection.sending') : t('commentSection.sendReport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

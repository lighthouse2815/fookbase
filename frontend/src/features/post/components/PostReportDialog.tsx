import { AlertTriangle } from 'lucide-react';

interface PostReportDialogProps {
  isOpen: boolean;
  isReportingPost: boolean;
  reportReason: string;
  setReportReason: (value: string) => void;
  reportReasonError: string | null;
  setReportReasonError: (value: string | null) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const PostReportDialog = ({
  isOpen,
  isReportingPost,
  reportReason,
  setReportReason,
  reportReasonError,
  setReportReasonError,
  onClose,
  onConfirm,
}: PostReportDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        aria-label="Dong popup bao cao"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xac nhan bao cao bai viet</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Ban muon bao cao bai viet nay cho admin?
            </p>
            <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">Ly do bao cao</label>
            <textarea
              value={reportReason}
              onChange={(event) => {
                setReportReason(event.target.value);
                if (reportReasonError) {
                  setReportReasonError(null);
                }
              }}
              maxLength={500}
              rows={4}
              placeholder="Nhap ly do bao cao bai viet nay..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-rose-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">{reportReason.length}/500</p>
              {reportReasonError ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{reportReasonError}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isReportingPost}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isReportingPost}
              className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isReportingPost ? 'Dang gui...' : 'Xac nhan bao cao'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

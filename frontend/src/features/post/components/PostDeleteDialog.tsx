import { Trash2 } from 'lucide-react';

interface PostDeleteDialogProps {
  isOpen: boolean;
  isDeletingPost: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const PostDeleteDialog = ({
  isOpen,
  isDeletingPost,
  onClose,
  onConfirmDelete,
}: PostDeleteDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={() => {
          if (isDeletingPost) {
            return;
          }

          onClose();
        }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        aria-label="Đóng popup xóa bài viết"
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400" />

        <div className="space-y-4 p-5 sm:p-6">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            <Trash2 size={24} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Xác nhận xóa bài viết</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Bài viết sau khi xóa sẽ không thể khôi phục.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeletingPost}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void onConfirmDelete()}
              disabled={isDeletingPost}
              className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isDeletingPost ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

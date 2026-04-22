import { BookmarkPlus, Ellipsis, Flag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import { formatRelativeTime } from '@/shared/lib/date';
import type { Post } from '@/features/post/types/contracts';

interface PostCardHeaderProps {
  post: Post;
  authorProfilePath: string;
  showPostMenu: boolean;
  postMenuRef: RefObject<HTMLDivElement>;
  isPostMenuOpen: boolean;
  setIsPostMenuOpen: Dispatch<SetStateAction<boolean>>;
  isSavingPost: boolean;
  handleSavePost: () => Promise<void>;
  isPostOwner: boolean;
  setReportReason: (value: string) => void;
  setReportReasonError: (value: string | null) => void;
  setIsReportDialogOpen: Dispatch<SetStateAction<boolean>>;
  isReportingPost: boolean;
  setIsDeleteDialogOpen: Dispatch<SetStateAction<boolean>>;
  isDeletingPost: boolean;
}

export const PostCardHeader = ({
  post,
  authorProfilePath,
  showPostMenu,
  postMenuRef,
  isPostMenuOpen,
  setIsPostMenuOpen,
  isSavingPost,
  handleSavePost,
  isPostOwner,
  setReportReason,
  setReportReasonError,
  setIsReportDialogOpen,
  isReportingPost,
  setIsDeleteDialogOpen,
  isDeletingPost,
}: PostCardHeaderProps) => {
  return (
    <header className="flex items-start gap-2.5 sm:gap-3">
      <Link to={authorProfilePath} aria-label={post.author.fullName} className="inline-flex">
        <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
      </Link>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{post.author.fullName}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(post.createdAt)}</p>
      </div>

      {showPostMenu ? (
        <div ref={postMenuRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setIsPostMenuOpen((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 sm:h-9 sm:w-9"
            aria-label="Mo tuy chon bai viet"
          >
            <Ellipsis size={20} />
          </button>

          {isPostMenuOpen ? (
            <div className="absolute right-0 top-10 z-20 w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => void handleSavePost()}
                disabled={isSavingPost}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <BookmarkPlus size={16} />
                {isSavingPost ? 'Dang luu bai viet...' : 'Luu bai viet'}
              </button>
              {!isPostOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsPostMenuOpen(false);
                    setReportReason('');
                    setReportReasonError(null);
                    setIsReportDialogOpen(true);
                  }}
                  disabled={isReportingPost}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Flag size={16} />
                  Bao cao
                </button>
              ) : null}
              {isPostOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsPostMenuOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                  disabled={isDeletingPost}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={16} />
                  {isDeletingPost ? 'Dang xoa bai viet...' : 'Xoa bai viet'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};

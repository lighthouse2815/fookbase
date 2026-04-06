import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';

import type { FriendRequest } from '../../types/friendship';

type FriendRequestCardMode = 'received' | 'sent';

interface FriendRequestCardProps {
  request: FriendRequest;
  mode: FriendRequestCardMode;
  selected?: boolean;
  onSelect?: () => void;
  onConfirm?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

const formatRequestTime = (requestedAt?: string) => {
  if (!requestedAt) {
    return 'Vua xong';
  }

  const requestedDate = new Date(requestedAt);

  if (Number.isNaN(requestedDate.getTime())) {
    return 'Vua xong';
  }

  const difference = Date.now() - requestedDate.getTime();
  const minutes = Math.max(1, Math.floor(difference / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} phut truoc`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} gio truoc`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ngay truoc`;
};

export const FriendRequestCard = ({
  request,
  mode,
  selected = false,
  onSelect,
  onConfirm,
  onDelete,
  onCancel,
}: FriendRequestCardProps) => {
  const navigate = useNavigate();

  return (
    <article
      className={clsx(
        'rounded-2xl border bg-white p-4 shadow-sm transition-all dark:bg-slate-900/75',
        selected
          ? 'border-brand-400 shadow-brand-500/20 dark:border-brand-500'
          : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-500/60',
      )}
    >
      <button type="button" onClick={onSelect} className="group mb-3 flex w-full items-center gap-3 text-left">
        <img
          src={request.avatarUrl}
          alt={request.fullName}
          onClick={(event) => {
            event.stopPropagation();
            void navigate(`/profile/${request.id}`);
          }}
          className="h-14 w-14 cursor-pointer rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{request.fullName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{request.mutualFriends} ban chung</p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{formatRequestTime(request.requestedAt)}</p>
        </div>
      </button>

      {mode === 'received' ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Xac nhan
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Xoa
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Da gui loi moi
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Huy
          </button>
        </div>
      )}

      <Link
        to={`/profile/${request.id}`}
        className="mt-3 inline-flex text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
      >
        Xem trang ca nhan
      </Link>
    </article>
  );
};

import { Loader2, Phone, Search, UserCheck, UserPlus, UsersRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useFriendSearchPage } from '@/features/friendship/hooks/useFriendSearchPage';
import { getFriendSearchStatusMeta, normalizeFriendSearchStatus } from '@/features/friendship/utils/page.util';
import { PostCard } from '@/features/post/components/PostCard';

export const FriendSearchPage = () => {
  const {
    currentUser,
    searchInput,
    setSearchInput,
    fetchState,
    searchMode,
    results,
    hashtagPosts,
    hashtagHasMore,
    isLoadingMoreHashtagPosts,
    errorMessage,
    actionMessage,
    actionUserId,
    actionType,
    handleSearchSubmit,
    handleLoadMoreHashtagPosts,
    handleHashtagPostDeleted,
    handleSendFriendRequest,
    handleCancelSentRequest,
    handleAcceptReceivedRequest,
    handleRejectReceivedRequest,
    showEmptyState,
  } = useFriendSearchPage();

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tìm người dùng hoặc hashtag</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Nhập tên hiển thị, số điện thoại hoặc #hashtag để tìm nhanh.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <UsersRound size={14} />
            {searchMode === 'hashtags' ? hashtagPosts.length : results.length} kết quả
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A hoặc #fookbase"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:pr-24"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:absolute sm:right-1.5 sm:top-1/2 sm:mt-0 sm:w-auto sm:-translate-y-1/2 sm:py-1.5"
            >
              Tìm
            </button>
          </div>
        </form>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        {actionMessage ? (
          <p className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200">
            {actionMessage}
          </p>
        ) : null}
      </header>

      {fetchState === 'loading' ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
            <Loader2 size={16} className="animate-spin" />
            {searchMode === 'hashtags' ? 'Đang tìm hashtag...' : 'Đang tìm người dùng...'}
          </div>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
          {searchMode === 'hashtags'
            ? 'Không tìm thấy hashtag phù hợp.'
            : 'Không tìm thấy người dùng phù hợp.'}
        </section>
      ) : null}

      {searchMode === 'hashtags' && hashtagPosts.length > 0 ? (
        <section className="space-y-3">
          {hashtagPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              enableMediaViewer
              onPostDeleted={handleHashtagPostDeleted}
            />
          ))}

          <div className="flex justify-center pb-1">
            {hashtagHasMore ? (
              <button
                type="button"
                onClick={() => void handleLoadMoreHashtagPosts()}
                disabled={isLoadingMoreHashtagPosts}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {isLoadingMoreHashtagPosts ? 'Đang tải...' : 'Xem thêm bài viết'}
              </button>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Đã hiển thị hết bài viết cho hashtag này.</p>
            )}
          </div>
        </section>
      ) : null}

      {searchMode === 'users' && results.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((profile) => {
            const status = normalizeFriendSearchStatus(profile.status);
            const isSelf = profile.userId === currentUser.id;
            const statusMeta = getFriendSearchStatusMeta(status, isSelf);
            const isProcessingAction = actionUserId === profile.userId;
            const isActionEnabled = statusMeta.action !== 'none';
            const canViewProfile = status !== 'BLOCKED';

            return (
              <article
                key={profile.userId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {canViewProfile ? (
                      <Link to={`/profile/${profile.userId}`} className="inline-flex shrink-0" aria-label={profile.displayName}>
                        <img
                          src={profile.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg'}
                          alt={profile.displayName}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="inline-flex shrink-0">
                        <img
                          src={profile.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg'}
                          alt={profile.displayName}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {profile.displayName}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Phone size={12} />
                        {profile.phoneNumber}
                      </p>
                      <p
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
                      >
                        {statusMeta.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {statusMeta.action === 'respond' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => void handleAcceptReceivedRequest(profile.userId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessingAction && actionType === 'accept' ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <UserCheck size={15} />
                          )}
                          {isProcessingAction && actionType === 'accept' ? 'Đang chấp nhận...' : 'Chấp nhận'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => void handleRejectReceivedRequest(profile.userId)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessingAction && actionType === 'reject' ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <X size={15} />
                          )}
                          {isProcessingAction && actionType === 'reject' ? 'Đang từ chối...' : 'Từ chối'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!isActionEnabled || isProcessingAction}
                        onClick={() =>
                          void (statusMeta.action === 'cancel'
                            ? handleCancelSentRequest(profile.userId)
                            : handleSendFriendRequest(profile.userId))
                        }
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${statusMeta.buttonClassName}`}
                      >
                        {isProcessingAction ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : statusMeta.action === 'cancel' ? (
                          <X size={15} />
                        ) : (
                          <UserPlus size={15} />
                        )}
                        {isProcessingAction
                          ? statusMeta.action === 'cancel'
                            ? 'Đang hủy...'
                            : 'Đang gửi...'
                          : statusMeta.buttonLabel}
                      </button>
                    )}

                    {canViewProfile ? (
                      <Link
                        to={`/profile/${profile.userId}`}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Xem trang cá nhân
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
};

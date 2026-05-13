import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { Link } from 'react-router-dom';

import { detectMediaKind } from '@/features/post/utils/media';
import type { Post } from '@/features/post/types/contracts';
import { formatRelativeTime } from '@/shared/lib/date';

const POST_CONTENT_PREVIEW_LIMIT = 180;

interface PostCardContentProps {
  t: TFunction;
  post: Post;
  mediaUrls: string[];
  enableMediaViewer: boolean;
  isContentExpanded: boolean;
  setIsContentExpanded: Dispatch<SetStateAction<boolean>>;
  onOpenMediaAt: (index: number) => void;
  onOpenOriginalMediaAt: (index: number, mediaUrls: string[], authorName: string) => void;
}

export const PostCardContent = ({
  t,
  post,
  mediaUrls,
  enableMediaViewer,
  isContentExpanded,
  setIsContentExpanded,
  onOpenMediaAt,
  onOpenOriginalMediaAt,
}: PostCardContentProps) => {
  const mediaKind = detectMediaKind(mediaUrls[0]);
  const normalizedPostContent = post.content?.trimEnd() ?? '';
  const shouldTruncatePostContent = normalizedPostContent.length > POST_CONTENT_PREVIEW_LIMIT;
  const displayedPostContent =
    shouldTruncatePostContent && !isContentExpanded
      ? `${normalizedPostContent.slice(0, POST_CONTENT_PREVIEW_LIMIT).trimEnd()}...`
      : normalizedPostContent;
  const allMediaAreImages = mediaUrls.length > 0 && mediaUrls.every((mediaUrl) => detectMediaKind(mediaUrl) === 'image');
  const hiddenMediaCount = mediaUrls.length > 4 ? mediaUrls.length - 4 : 0;
  const originalPost = post.originalPost ?? null;
  const originalMediaUrls = originalPost?.imageUrls ?? [];
  const originalPreviewMediaUrl = originalMediaUrls[0];
  const originalPreviewMediaKind = detectMediaKind(originalPreviewMediaUrl);
  const hasOriginalMoreMedia = originalMediaUrls.length > 1;

  const renderMediaTile = (index: number, className: string, overlayCount = 0) => {
    const mediaUrl = mediaUrls[index];
    if (!mediaUrl) {
      return null;
    }

    const itemKind = detectMediaKind(mediaUrl);
    const mediaElement = itemKind === 'video' ? (
      <video src={mediaUrl} controls={!enableMediaViewer} className={`${className} min-h-0 bg-black object-cover`} />
    ) : (
      <img
        src={mediaUrl}
        alt={`${post.author.fullName}-${index + 1}`}
        className={`${className} min-h-0 bg-slate-100 object-cover dark:bg-slate-900`}
      />
    );

    const overlayElement = overlayCount > 0 ? (
      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-bold text-white">
        +{overlayCount}
      </div>
    ) : null;

    if (enableMediaViewer) {
      return (
        <button
          type="button"
          onClick={() => onOpenMediaAt(index)}
          className="relative block h-full min-h-0 w-full overflow-hidden rounded-xl cursor-zoom-in"
          aria-label={itemKind === 'video' ? 'Xem video bai post o che do lon' : 'Xem anh bai post o che do lon'}
        >
          {mediaElement}
          {overlayElement}
        </button>
      );
    }

    return (
      <div className="relative h-full min-h-0 w-full overflow-hidden rounded-xl">
        {mediaElement}
        {overlayElement}
      </div>
    );
  };

  return (
    <>
      {normalizedPostContent ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          {displayedPostContent}
          {shouldTruncatePostContent ? (
            <button
              type="button"
              onClick={() => setIsContentExpanded((previous) => !previous)}
              className="text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {isContentExpanded ? t('post.seeLess') : t('post.seeMore')}
            </button>
          ) : null}
        </p>
      ) : null}

      {originalPost ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/30">
          <div className="p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shared from</p>
            <div className="mt-2 flex items-start gap-2.5">
              <Link
                to={`/profile/${originalPost.author.id}`}
                aria-label={originalPost.author.fullName}
                className="inline-flex"
              >
                <img
                  src={originalPost.author.avatarUrl}
                  alt={originalPost.author.fullName}
                  className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {originalPost.author.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatRelativeTime(originalPost.createdAt)}
                </p>
              </div>
            </div>
            {originalPost.content ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
                {originalPost.content}
              </p>
            ) : null}
          </div>

          {originalPreviewMediaUrl ? (
            enableMediaViewer ? (
              <button
                type="button"
                onClick={() => onOpenOriginalMediaAt(0, originalMediaUrls, originalPost.author.fullName)}
                className="relative block w-full cursor-zoom-in overflow-hidden border-t border-slate-200 dark:border-slate-700"
                aria-label={originalPreviewMediaKind === 'video' ? 'Xem video bai goc o che do lon' : 'Xem anh bai goc o che do lon'}
              >
                {originalPreviewMediaKind === 'video' ? (
                  <video src={originalPreviewMediaUrl} className="max-h-[560px] w-full bg-black object-contain" />
                ) : (
                  <img
                    src={originalPreviewMediaUrl}
                    alt={originalPost.author.fullName}
                    className="max-h-[560px] w-full bg-slate-100 object-contain dark:bg-slate-900"
                  />
                )}
                {hasOriginalMoreMedia ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-semibold text-white">
                    +{originalMediaUrls.length - 1}
                  </div>
                ) : null}
              </button>
            ) : (
              <div className="relative overflow-hidden border-t border-slate-200 dark:border-slate-700">
                {originalPreviewMediaKind === 'video' ? (
                  <video src={originalPreviewMediaUrl} controls className="max-h-[560px] w-full bg-black object-contain" />
                ) : (
                  <img
                    src={originalPreviewMediaUrl}
                    alt={originalPost.author.fullName}
                    className="max-h-[560px] w-full bg-slate-100 object-contain dark:bg-slate-900"
                  />
                )}
                {hasOriginalMoreMedia ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-semibold text-white">
                    +{originalMediaUrls.length - 1}
                  </div>
                ) : null}
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {mediaUrls.length === 1 && mediaKind === 'video' ? (
        enableMediaViewer ? (
          <button
            type="button"
            onClick={() => onOpenMediaAt(0)}
            className="mt-3 block w-full cursor-zoom-in rounded-xl"
            aria-label="Xem video bai post o che do lon"
          >
            <video src={mediaUrls[0]} className="max-h-[560px] w-full rounded-xl bg-black" />
          </button>
        ) : (
          <video src={mediaUrls[0]} controls className="mt-3 max-h-[560px] w-full rounded-xl bg-black" />
        )
      ) : mediaUrls.length === 1 && allMediaAreImages ? (
        enableMediaViewer ? (
          <button
            type="button"
            onClick={() => onOpenMediaAt(0)}
            className="mt-3 block w-full cursor-zoom-in rounded-xl"
            aria-label="Xem anh bai post o che do lon"
          >
            <img
              src={mediaUrls[0]}
              alt={post.author.fullName}
              className="max-h-[560px] w-full rounded-xl bg-slate-100 object-contain dark:bg-slate-900"
            />
          </button>
        ) : (
          <img
            src={mediaUrls[0]}
            alt={post.author.fullName}
            className="mt-3 max-h-[560px] w-full rounded-xl bg-slate-100 object-contain dark:bg-slate-900"
          />
        )
      ) : allMediaAreImages && mediaUrls.length === 2 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {renderMediaTile(0, 'h-44 w-full sm:h-64')}
          {renderMediaTile(1, 'h-44 w-full sm:h-64')}
        </div>
      ) : allMediaAreImages && mediaUrls.length === 3 ? (
        <div className="mt-3 grid h-[260px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:h-[420px] lg:h-[460px]">
          {renderMediaTile(0, 'h-full w-full')}
          <div className="grid h-full min-h-0 grid-rows-[repeat(2,minmax(0,1fr))] gap-2">
            {renderMediaTile(1, 'h-full w-full')}
            {renderMediaTile(2, 'h-full w-full')}
          </div>
        </div>
      ) : allMediaAreImages && mediaUrls.length >= 4 ? (
        <div className="mt-3 grid h-[260px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:h-[420px] lg:h-[460px]">
          {renderMediaTile(0, 'h-full w-full')}
          <div className="grid h-full min-h-0 grid-rows-[repeat(3,minmax(0,1fr))] gap-2">
            {renderMediaTile(1, 'h-full w-full')}
            {renderMediaTile(2, 'h-full w-full')}
            {renderMediaTile(3, 'h-full w-full', hiddenMediaCount)}
          </div>
        </div>
      ) : mediaUrls.length > 1 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {mediaUrls.map((_, index) => (
            <div key={`${post.id}-media-fallback-${index}`}>
              {renderMediaTile(index, 'h-56 w-full')}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

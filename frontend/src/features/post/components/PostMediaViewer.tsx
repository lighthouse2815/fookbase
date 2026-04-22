import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { WheelEvent } from 'react';

import type { MediaKind } from '@/features/post/utils/media';

interface PostMediaViewerProps {
  isOpen: boolean;
  activeMediaUrl: string | null;
  activeMediaKind: MediaKind;
  authorName: string;
  mediaUrls: string[];
  activeMediaIndex: number;
  imageViewerScale: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
}

export const PostMediaViewer = ({
  isOpen,
  activeMediaUrl,
  activeMediaKind,
  authorName,
  mediaUrls,
  activeMediaIndex,
  imageViewerScale,
  onClose,
  onPrev,
  onNext,
  onWheel,
}: PostMediaViewerProps) => {
  if (!isOpen || !activeMediaUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/85"
        aria-label="Dong xem media lon"
      />

      <div className="relative max-h-[90vh] w-full max-w-5xl" onWheel={onWheel}>
        {activeMediaKind === 'video' ? (
          <video
            src={activeMediaUrl}
            controls
            autoPlay
            className="max-h-[90vh] w-full rounded-2xl border border-white/15 bg-black/60 object-contain shadow-2xl"
          />
        ) : (
          <img
            src={activeMediaUrl}
            alt={authorName}
            className="max-h-[90vh] w-full rounded-2xl border border-white/15 bg-black/40 object-contain shadow-2xl transition-transform duration-100 ease-out"
            style={{ transform: `scale(${imageViewerScale})` }}
          />
        )}

        {mediaUrls.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Anh truoc"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Anh tiep theo"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {activeMediaIndex + 1}/{mediaUrls.length}
            </div>
          </>
        ) : null}

        {activeMediaKind === 'image' ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {Math.round(imageViewerScale * 100)}%
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
          aria-label="Dong"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?.*)?$/i;

export type MediaKind = 'image' | 'video' | null;

export const detectMediaKind = (mediaUrl?: string | null): MediaKind => {
  if (!mediaUrl) {
    return null;
  }

  const normalized = mediaUrl.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('data:video/')) {
    return 'video';
  }

  if (normalized.startsWith('data:image/')) {
    return 'image';
  }

  if (normalized.includes('/video/upload/')) {
    return 'video';
  }

  if (normalized.includes('/image/upload/')) {
    return 'image';
  }

  return VIDEO_EXTENSIONS.test(normalized) ? 'video' : 'image';
};

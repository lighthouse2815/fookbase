import type { StoryPayload } from '@/features/story/api/dtos/response.dto';
import type { StoryItem, StoryReactionType } from '@/features/story/types/contracts';
import { ENV } from "@/shared/env/env";

const resolveStoryMediaUrl = (mediaUrl: string): string => {
    const normalized = mediaUrl.trim();
    if (!normalized) {
      return normalized;
    }
  
    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
      return normalized;
    }
  
    const baseUrl = ENV.API_BASE_URL;
    if (!baseUrl) {
      return normalized;
    }
  
    try {
      return new URL(normalized, baseUrl).toString();
    } catch {
      return normalized;
    }
  };
export const mapStory = (payload: StoryPayload): StoryItem => ({
    id: payload.id,
    userId: payload.userId,
    author: {
      id: payload.author.id,
      username: payload.author.username,
      displayName: payload.author.displayName,
      avatarUrl: payload.author.avatarUrl,
    },
    mediaUrl: resolveStoryMediaUrl(payload.mediaUrl),
    mediaType: payload.mediaType,
    content: payload.content ?? undefined,
    createdAt: payload.createdAt,
    expiredAt: payload.expiredAt,
    isViewedByCurrentUser: payload.isViewedByCurrentUser,
    currentUserReactionType: normalizeReactionType(payload.currentUserReactionType),
    viewCount: payload.viewCount,
  });

  export const normalizeReactionType = (value?: string | null): StoryReactionType | null => {
    if (!value) {
      return null;
    }
  
    const normalized = value.trim().toUpperCase();
    if (normalized === 'LIKE' || normalized === 'WOW' || normalized === 'SAD' || normalized === 'ANGRY' || normalized === 'HAHA' || normalized === 'LOVE') {
      return normalized;
    }
  
    return null;
  };



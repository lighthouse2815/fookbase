export type StoryMediaType = 'IMAGE' | 'VIDEO';
export type StoryReactionType = 'LIKE' | 'WOW' | 'SAD' | 'ANGRY' | 'HAHA' | 'LOVE';

export interface StoryAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface StoryItem {
  id: string;
  userId: string;
  author: StoryAuthor;
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string;
  createdAt: string;
  expiredAt: string;
  isViewedByCurrentUser: boolean;
  currentUserReactionType?: StoryReactionType | null;
  viewCount: number;
}

export interface StoryGroup {
  userId: string;
  author: StoryAuthor;
  stories: StoryItem[];
  hasUnviewed: boolean;
  latestCreatedAt: string;
  isMine: boolean;
}

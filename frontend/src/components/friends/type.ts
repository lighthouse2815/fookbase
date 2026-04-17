import type { FriendRequest, FriendSuggestion, FriendUser } from '@/interface/friendship';

export type UserCardVariant = 'grid' | 'list';

export type FriendRequestCardMode = 'received' | 'sent';

export type PreviewTab = 'posts' | 'photos' | 'about';

export type PreviewRelation = 'received' | 'sent' | 'suggestion' | 'friend' | null;

export type ProfilePreviewUser = FriendSuggestion | FriendRequest | FriendUser;

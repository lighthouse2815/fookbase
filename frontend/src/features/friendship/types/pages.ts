export type FriendsTab = 'home' | 'requests' | 'suggestions' | 'friends';

export type FriendFilter = 'all' | 'online' | 'sameFaculty';

export type FriendsPageFetchState = 'loading' | 'success' | 'error';

export type ProfileRelation = 'received' | 'sent' | 'suggestion' | 'friend' | null;

export type PresenceAwareUser = { id: string; isOnline?: boolean };

export type FriendSearchFetchState = 'idle' | 'loading' | 'success' | 'error';

export type FriendSearchActionKind = 'send' | 'cancel' | 'accept' | 'reject' | null;

export type FriendSearchMode = 'users' | 'hashtags';

export interface HashtagSearchResult {
  id: string;
  name: string;
  usageCount: number;
}

export interface FriendSearchStatusMeta {
  label: string;
  action: 'send' | 'cancel' | 'respond' | 'none';
  buttonLabel: string;
  buttonClassName: string;
  badgeClassName: string;
}

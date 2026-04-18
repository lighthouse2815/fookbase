export type FriendshipStatusCode =
  | 'NONE'
  | 'PENDING'
  | 'INVITED'
  | 'ACCEPTED'
  | 'BLOCKED'
  | 'REJECTED'
  | 'REMOVED'
  | 'UNKNOWN';

export const normalizeFriendshipStatus = (value?: string): FriendshipStatusCode => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return 'NONE';
  }

  if (
    normalized === 'NONE'
    || normalized === 'PENDING'
    || normalized === 'INVITED'
    || normalized === 'ACCEPTED'
    || normalized === 'BLOCKED'
    || normalized === 'REJECTED'
    || normalized === 'REMOVED'
  ) {
    return normalized;
  }

  return 'UNKNOWN';
};

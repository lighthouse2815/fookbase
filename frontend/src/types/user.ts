export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  avatarUrl: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  faculty?: string;
}


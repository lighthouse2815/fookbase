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

export interface FriendPresenceResult {
  onlineUsers: User[];
  offlineUsers: User[];
}

export interface SecurityAccountInfo {
  username: string;
  email: string | null;
  phoneNumber: string | null;
}

export interface UpdateSecurityAccountRequest {
  username?: string;
  phoneNumber?: string;
}

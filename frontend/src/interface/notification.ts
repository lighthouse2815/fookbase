export interface NotificationItem {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type?: string;
  actorUserId?: string;
  postId?: string;
  commentId?: string;
  avatarUrl?: string;
  requestId?: string;
  isVirtual?: boolean;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  actorUserId: string;
  postId?: string | null;
  commentId?: string | null;
  type?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}


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

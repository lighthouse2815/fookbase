import type { NotificationItem, NotificationPayload } from '@/interface/notification';

export const mapNotificationPayload = (payload: NotificationPayload): NotificationItem => ({
  id: payload.id,
  message: payload.message,
  createdAt: payload.createdAt,
  isRead: payload.isRead,
  type: payload.type ?? 'GENERAL',
  actorUserId: payload.actorUserId,
  postId: payload.postId ?? undefined,
  commentId: payload.commentId ?? undefined,
});

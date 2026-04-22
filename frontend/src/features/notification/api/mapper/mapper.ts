import type { NotificationPayload } from '@/features/notification/api/dtos/response.dto';
import type { NotificationItem } from '@/features/notification/types/contracts';

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

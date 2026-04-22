export interface NotificationResponseDto {
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

export type NotificationPayload = NotificationResponseDto;

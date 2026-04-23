export interface NotificationResponseDto {
  id: string;
  userId: string;
  actorUserId: string;
  actorDisplayName?: string | null;
  actorAvatarUrl?: string | null;
  postId?: string | null;
  commentId?: string | null;
  type?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationPayload = NotificationResponseDto;

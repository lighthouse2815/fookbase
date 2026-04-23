import type { TFunction } from 'i18next';

import type { NotificationItem } from '@/features/notification/types/contracts';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

const TYPE_TEMPLATE_KEY: Record<string, string> = {
  FRIEND_REQUEST: 'notifications.templates.friendRequest',
  FRIEND_POST: 'notifications.templates.friendPost',
  LIKE: 'notifications.templates.postReaction',
  COMMENT: 'notifications.templates.postComment',
  COMMENT_REPLY: 'notifications.templates.commentReply',
  COMMENT_REACTION: 'notifications.templates.commentReaction',
  STORY_REACTION: 'notifications.templates.storyReaction',
  POST_REPORT_APPROVED: 'notifications.templates.postReportApproved',
  POST_REPORT_REJECTED: 'notifications.templates.postReportRejected',
  POST_REPORT_TARGET_ACTION: 'notifications.templates.postReportTargetAction',
  COMMENT_REPORT_APPROVED: 'notifications.templates.commentReportApproved',
  COMMENT_REPORT_REJECTED: 'notifications.templates.commentReportRejected',
  COMMENT_REPORT_TARGET_ACTION: 'notifications.templates.commentReportTargetAction',
  STORY_REPORT_APPROVED: 'notifications.templates.storyReportApproved',
  STORY_REPORT_REJECTED: 'notifications.templates.storyReportRejected',
  STORY_REPORT_TARGET_ACTION: 'notifications.templates.storyReportTargetAction',
  USER_REPORT_APPROVED: 'notifications.templates.userReportApproved',
  USER_REPORT_REJECTED: 'notifications.templates.userReportRejected',
  USER_REPORT_TARGET_ACTION: 'notifications.templates.userReportTargetAction',
};

const HIGHLIGHT_ACTOR_TYPES = new Set([
  'FRIEND_REQUEST',
  'FRIEND_POST',
  'LIKE',
  'COMMENT',
  'COMMENT_REPLY',
  'COMMENT_REACTION',
  'STORY_REACTION',
]);

export interface NotificationPresentation {
  type: string;
  actorName: string;
  avatarUrl: string;
  highlightActor: boolean;
  messageText: string;
}

const normalizeType = (value?: string): string => value?.trim().toUpperCase() ?? 'GENERAL';

const resolveActorName = (item: NotificationItem, t: TFunction): string => {
  return item.actorName?.trim() || t('notifications.someone');
};

const resolveAvatarUrl = (item: NotificationItem): string => {
  return item.avatarUrl?.trim() || DEFAULT_AVATAR_URL;
};

const resolveLanguage = (language: string): 'en' | 'vi' => {
  return language.trim().toLowerCase().startsWith('en') ? 'en' : 'vi';
};

const selectLocalizedMessage = (rawMessage: string, language: string): string => {
  const normalizedRawMessage = rawMessage.trim();
  if (!normalizedRawMessage) {
    return '';
  }

  // Legacy backend messages may ship bilingual text as "vi / en".
  const parts = normalizedRawMessage.split(/\s+\/\s+/);
  if (parts.length < 2) {
    return normalizedRawMessage;
  }

  return resolveLanguage(language) === 'en'
    ? parts[parts.length - 1].trim()
    : parts[0].trim();
};

const stripActorPrefix = (
  messageText: string,
  actorName: string,
): { messageText: string; usedActorPrefix: boolean } => {
  const normalizedMessage = messageText.trim();
  if (!normalizedMessage || !actorName.trim()) {
    return { messageText: normalizedMessage, usedActorPrefix: false };
  }

  if (!normalizedMessage.toLowerCase().startsWith(actorName.toLowerCase())) {
    return { messageText: normalizedMessage, usedActorPrefix: false };
  }

  const stripped = normalizedMessage.slice(actorName.length).trimStart();
  if (!stripped) {
    return { messageText: normalizedMessage, usedActorPrefix: false };
  }

  return {
    messageText: stripped,
    usedActorPrefix: true,
  };
};

export const formatNotificationPresentation = (
  item: NotificationItem,
  t: TFunction,
  language: string,
): NotificationPresentation => {
  const type = normalizeType(item.type);
  const actorName = resolveActorName(item, t);
  const avatarUrl = resolveAvatarUrl(item);
  const templateKey = TYPE_TEMPLATE_KEY[type];

  if (templateKey) {
    return {
      type,
      actorName,
      avatarUrl,
      highlightActor: HIGHLIGHT_ACTOR_TYPES.has(type),
      messageText: t(templateKey),
    };
  }

  const fallbackMessage = selectLocalizedMessage(item.message, language) || t('notifications.generic');
  const parsedFallback = stripActorPrefix(fallbackMessage, actorName);

  return {
    type,
    actorName,
    avatarUrl,
    highlightActor: parsedFallback.usedActorPrefix,
    messageText: parsedFallback.messageText,
  };
};

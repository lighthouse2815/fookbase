namespace InteractHub.Api.Domain.Enums;

public enum UserRole
{
    ADMIN,
    USER
}

public enum UserStatus
{
    ACTIVE,
    BANNED,
    INACTIVE
}

public enum AuthProvider
{
    LOCAL,
    GOOGLE,
    FACEBOOK
}

public enum Gender
{
    MALE,
    FEMALE,
    OTHER
}

public enum FriendshipStatus
{
    PENDING,
    ACCEPTED,
    REJECTED,
    BLOCKED,
    REMOVED
}

public enum ReactionType
{
    LIKE,
    WOW,
    SAD,
    ANGRY,
    HAHA,
    LOVE
}

public enum ReportStatus
{
    PENDING,
    RESOLVED,
    REJECTED
}

public enum AdminAuditActionType
{
    USER_STATUS_UPDATED,
    USER_REPORT_APPROVED,
    USER_REPORT_REJECTED,
    POST_REPORT_APPROVED,
    POST_REPORT_REJECTED,
    COMMENT_REPORT_APPROVED,
    COMMENT_REPORT_REJECTED,
    STORY_REPORT_APPROVED,
    STORY_REPORT_REJECTED,
    APP_REVIEW_DELETED,
    APP_REVIEW_HIDDEN,
    APP_REVIEW_UNHIDDEN
}

public enum AdminAuditEntityType
{
    USER,
    USER_REPORT,
    POST_REPORT,
    COMMENT_REPORT,
    STORY_REPORT,
    APP_REVIEW
}

public enum NotificationType
{
    GENERAL,
    LIKE,
    COMMENT,
    COMMENT_REPLY,
    COMMENT_REACTION,
    FRIEND_POST,
    STORY_REACTION,
    USER_REPORT_APPROVED,
    USER_REPORT_REJECTED,
    USER_REPORT_TARGET_ACTION,
    POST_REPORT_APPROVED,
    POST_REPORT_REJECTED,
    POST_REPORT_TARGET_ACTION,
    COMMENT_REPORT_APPROVED,
    COMMENT_REPORT_REJECTED,
    COMMENT_REPORT_TARGET_ACTION,
    STORY_REPORT_APPROVED,
    STORY_REPORT_REJECTED,
    STORY_REPORT_TARGET_ACTION
}

public enum MediaType
{
    IMAGE,
    VIDEO
}

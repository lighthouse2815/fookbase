namespace InteractHub.Api.Common.Enums;

public enum ErrorCode
{
    REQUEST_FAILED,
    VALIDATION_ERROR,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    SERVICE_UNAVAILABLE,
    UPSTREAM_SERVICE_ERROR,
    SERVICE_ADMIN_JAVA_FAILED,
    BUSINESS_RULE_VIOLATION,
    INTERNAL_ERROR,

    USER_NOT_FOUND,
    ADMIN_USER_NOT_FOUND,
    TARGET_USER_NOT_FOUND,
    ACTOR_USER_NOT_FOUND,
    POST_NOT_FOUND,
    COMMENT_NOT_FOUND,
    PARENT_COMMENT_NOT_FOUND,
    STORY_NOT_FOUND,
    NOTIFICATION_NOT_FOUND,
    APP_REVIEW_NOT_FOUND,
    HASHTAG_NOT_FOUND,
    USER_REPORT_NOT_FOUND,
    POST_REPORT_NOT_FOUND,
    COMMENT_REPORT_NOT_FOUND,
    STORY_REPORT_NOT_FOUND,

    ADMIN_LOGIN_FAILED,
    ADMIN_PERMISSION_REQUIRED,
    RESET_TOKEN_HEADER_REQUIRED,
    CLOUDINARY_SIGNING_NOT_CONFIGURED,
    ROOM_NOT_FOUND,

    ADMIN_USER_ID_REQUIRED,
    ENTITY_ID_REQUIRED,
    TARGET_USER_ID_REQUIRED,
    AUDIT_DETAILS_REQUIRED,
    INVALID_USER_STATUS,
    INVALID_REPORT_STATUS,
    INVALID_REACTION_TYPE,
    INVALID_NOTIFICATION_TYPE,

    APP_REVIEW_RATING_INVALID,
    DISPLAY_NAME_REQUIRED,
    DISPLAY_NAME_LENGTH_INVALID,
    COMMENT_REQUIRED,
    COMMENT_LENGTH_INVALID,

    DUPLICATE_COMMENT_REPORT,
    DUPLICATE_POST_REPORT,
    DUPLICATE_USER_REPORT,
    DUPLICATE_STORY_REPORT,
    CANNOT_REPORT_SELF,
    CANNOT_REPORT_OWN_STORY,
    PARENT_COMMENT_POST_MISMATCH,
    COMMENT_TEXT_OR_MEDIA_REQUIRED,
    POST_TEXT_OR_MEDIA_REQUIRED,

    INVALID_STORY_MEDIA_TYPE,
    STORY_MEDIA_URL_REQUIRED,
    STORY_MEDIA_URL_INVALID,
    STORY_IMAGE_URL_INVALID,
    STORY_VIDEO_URL_INVALID,

    HASHTAG_KEYWORD_REQUIRED,
    HASHTAG_ALREADY_EXISTS,
    HASHTAG_IN_USE,
    HASHTAG_NAME_REQUIRED
}

public static class ErrorCodeExtensions
{
    public static int GetStatusCode(this ErrorCode errorCode)
    {
        return errorCode switch
        {
            ErrorCode.UNAUTHORIZED => StatusCodes.Status401Unauthorized,
            ErrorCode.FORBIDDEN or ErrorCode.ADMIN_PERMISSION_REQUIRED => StatusCodes.Status403Forbidden,
            ErrorCode.NOT_FOUND
                or ErrorCode.USER_NOT_FOUND
                or ErrorCode.ADMIN_USER_NOT_FOUND
                or ErrorCode.TARGET_USER_NOT_FOUND
                or ErrorCode.ACTOR_USER_NOT_FOUND
                or ErrorCode.POST_NOT_FOUND
                or ErrorCode.COMMENT_NOT_FOUND
                or ErrorCode.PARENT_COMMENT_NOT_FOUND
                or ErrorCode.STORY_NOT_FOUND
                or ErrorCode.NOTIFICATION_NOT_FOUND
                or ErrorCode.APP_REVIEW_NOT_FOUND
                or ErrorCode.HASHTAG_NOT_FOUND
                or ErrorCode.USER_REPORT_NOT_FOUND
                or ErrorCode.POST_REPORT_NOT_FOUND
                or ErrorCode.COMMENT_REPORT_NOT_FOUND
                or ErrorCode.STORY_REPORT_NOT_FOUND
                or ErrorCode.ROOM_NOT_FOUND => StatusCodes.Status404NotFound,
            ErrorCode.SERVICE_UNAVAILABLE
                or ErrorCode.UPSTREAM_SERVICE_ERROR
                or ErrorCode.SERVICE_ADMIN_JAVA_FAILED
                or ErrorCode.CLOUDINARY_SIGNING_NOT_CONFIGURED => StatusCodes.Status503ServiceUnavailable,
            ErrorCode.INTERNAL_ERROR => StatusCodes.Status500InternalServerError,
            _ => StatusCodes.Status400BadRequest
        };
    }

    public static string GetDefaultMessage(this ErrorCode errorCode)
    {
        return errorCode switch
        {
            ErrorCode.REQUEST_FAILED => "Request failed.",
            ErrorCode.VALIDATION_ERROR => "Invalid request.",
            ErrorCode.UNAUTHORIZED => "Unauthorized.",
            ErrorCode.FORBIDDEN => "Forbidden.",
            ErrorCode.NOT_FOUND => "Resource not found.",
            ErrorCode.SERVICE_UNAVAILABLE => "Service is unavailable.",
            ErrorCode.UPSTREAM_SERVICE_ERROR => "Upstream service error.",
            ErrorCode.SERVICE_ADMIN_JAVA_FAILED => "Java admin service error.",
            ErrorCode.BUSINESS_RULE_VIOLATION => "Request cannot be completed.",
            ErrorCode.INTERNAL_ERROR => "An unexpected error occurred.",

            ErrorCode.USER_NOT_FOUND => "User not found.",
            ErrorCode.ADMIN_USER_NOT_FOUND => "Admin user not found.",
            ErrorCode.TARGET_USER_NOT_FOUND => "Target user not found.",
            ErrorCode.ACTOR_USER_NOT_FOUND => "Actor user not found.",
            ErrorCode.POST_NOT_FOUND => "Post not found.",
            ErrorCode.COMMENT_NOT_FOUND => "Comment not found.",
            ErrorCode.PARENT_COMMENT_NOT_FOUND => "Parent comment not found.",
            ErrorCode.STORY_NOT_FOUND => "Story not found.",
            ErrorCode.NOTIFICATION_NOT_FOUND => "Notification not found.",
            ErrorCode.APP_REVIEW_NOT_FOUND => "App review not found.",
            ErrorCode.HASHTAG_NOT_FOUND => "Hashtag not found.",
            ErrorCode.USER_REPORT_NOT_FOUND => "User report not found.",
            ErrorCode.POST_REPORT_NOT_FOUND => "Post report not found.",
            ErrorCode.COMMENT_REPORT_NOT_FOUND => "Comment report not found.",
            ErrorCode.STORY_REPORT_NOT_FOUND => "Story report not found.",

            ErrorCode.ADMIN_LOGIN_FAILED => "Admin login failed.",
            ErrorCode.ADMIN_PERMISSION_REQUIRED => "This account does not have admin permission.",
            ErrorCode.RESET_TOKEN_HEADER_REQUIRED => "X-Reset-Token header is required.",
            ErrorCode.CLOUDINARY_SIGNING_NOT_CONFIGURED => "Cloudinary signing is not configured.",
            ErrorCode.ROOM_NOT_FOUND => "Room not found.",

            ErrorCode.ADMIN_USER_ID_REQUIRED => "Admin user id is required.",
            ErrorCode.ENTITY_ID_REQUIRED => "Entity id is required.",
            ErrorCode.TARGET_USER_ID_REQUIRED => "Target user id is required.",
            ErrorCode.AUDIT_DETAILS_REQUIRED => "Audit details are required.",
            ErrorCode.INVALID_USER_STATUS => "Status must be ACTIVE, BANNED or INACTIVE.",
            ErrorCode.INVALID_REPORT_STATUS => "Status must be RESOLVED or REJECTED.",
            ErrorCode.INVALID_REACTION_TYPE => "Reaction type is invalid.",
            ErrorCode.INVALID_NOTIFICATION_TYPE => "Notification type is invalid.",

            ErrorCode.APP_REVIEW_RATING_INVALID => "Rating must be between 1 and 5.",
            ErrorCode.DISPLAY_NAME_REQUIRED => "Display name is required.",
            ErrorCode.DISPLAY_NAME_LENGTH_INVALID => "Display name length must be between 2 and 80 characters.",
            ErrorCode.COMMENT_REQUIRED => "Comment is required.",
            ErrorCode.COMMENT_LENGTH_INVALID => "Comment length must be between 3 and 1000 characters.",

            ErrorCode.DUPLICATE_COMMENT_REPORT => "You already have a pending report for this comment.",
            ErrorCode.DUPLICATE_POST_REPORT => "You already have a pending report for this post.",
            ErrorCode.DUPLICATE_USER_REPORT => "You already have a pending report for this user.",
            ErrorCode.DUPLICATE_STORY_REPORT => "You already have a pending report for this story.",
            ErrorCode.CANNOT_REPORT_SELF => "You cannot report yourself.",
            ErrorCode.CANNOT_REPORT_OWN_STORY => "You cannot report your own story.",
            ErrorCode.PARENT_COMMENT_POST_MISMATCH => "Parent comment does not belong to this post.",
            ErrorCode.COMMENT_TEXT_OR_MEDIA_REQUIRED => "Comment must include text or media.",
            ErrorCode.POST_TEXT_OR_MEDIA_REQUIRED => "Post must include text or media.",

            ErrorCode.INVALID_STORY_MEDIA_TYPE => "Story media type must be IMAGE or VIDEO.",
            ErrorCode.STORY_MEDIA_URL_REQUIRED => "Story media URL is required.",
            ErrorCode.STORY_MEDIA_URL_INVALID => "Story media URL must be absolute or start with '/'.",
            ErrorCode.STORY_IMAGE_URL_INVALID => "Story image URL must point to a supported image format.",
            ErrorCode.STORY_VIDEO_URL_INVALID => "Story video URL must point to a supported video format.",

            ErrorCode.HASHTAG_KEYWORD_REQUIRED => "Keyword is required.",
            ErrorCode.HASHTAG_ALREADY_EXISTS => "Hashtag already exists.",
            ErrorCode.HASHTAG_IN_USE => "Cannot delete hashtag because it is used by posts.",
            ErrorCode.HASHTAG_NAME_REQUIRED => "Hashtag name is required.",

            _ => "Request failed."
        };
    }
}




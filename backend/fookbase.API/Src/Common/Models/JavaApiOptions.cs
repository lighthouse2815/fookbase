namespace InteractHub.Api.Common.Models;

public class JavaApiOptions
{
    public const string SectionName = "JavaApi";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string UserByIdPathTemplate { get; set; } = "users/{id}";

    public string ProfileByUserIdPathTemplate { get; set; } = "profiles/public?userId={userId}";

    public string ProfileSummaryByUserIdPathTemplate { get; set; } = "profiles/summary?userId={userId}";

    public string ProfilePrivateByUserIdPathTemplate { get; set; } = "profiles?userId={userId}";

    public string ProfileMeOverviewPathTemplate { get; set; } = "profiles/me/overview";

    public string ProfileMeInfoSettingsPathTemplate { get; set; } = "profiles/me/profile-info-settings";

    public string ProfileMeInfoSettingsVisibilityPathTemplate { get; set; } = "profiles/me/profile-info-settings/visibility";

    public string ProfileMeInfoSettingsVisibilityUpdatePathTemplate { get; set; } = "profiles/me/profile-info-settings/visibility";

    public string ProfileMeSecurityPrivatePathTemplate { get; set; } = "profiles/me/security-private";

    public string ProfileMeSecurityPrivateUpdatePathTemplate { get; set; } = "profiles/me/security-private";

    public string ProfileMeUpdatePathTemplate { get; set; } = "profiles/me";

    public string ProfileSearchByPhonePathTemplate { get; set; } = "profiles/search?phoneNumber={phoneNumber}";

    public string AdminSearchUsersPathTemplate { get; set; } = "admin/users/search?keyword={keyword}";

    public string AdminUpdateUserStatusPathTemplate { get; set; } = "admin/users/{userId}/status";

    public string AdminUserStatsPathTemplate { get; set; } = "admin/users/stats";

    public string FriendsByUserIdPathTemplate { get; set; } = "friendships?userId={userId}";

    public string UserSuggestionsPathTemplate { get; set; } = "users/suggestions?page={page}&size={size}";

    public string MessengerPendingRequestersPathTemplate { get; set; } = "messenger/friendships/pending-requesters";

    public string MessengerContactsByUserPathTemplate { get; set; } = "messenger/contacts/getByUser";

    public string FriendPresencePathTemplate { get; set; } = "profiles/me/friends/presence";

    public string MessengerSendFriendRequestPathTemplate { get; set; } = "messenger/friendships";

    public string MessengerAcceptFriendRequestPathTemplate { get; set; } = "messenger/friendships/accept";

    public string MessengerRejectFriendRequestPathTemplate { get; set; } = "messenger/friendships/reject";

    public string MessengerUnfriendPathTemplate { get; set; } = "messenger/friendships";

    public string MessengerBlockUserPathTemplate { get; set; } = "messenger/friendships/block/{userId}";

    public string MessengerUnblockUserPathTemplate { get; set; } = "messenger/friendships/block/{userId}";

    public string MessengerBlockedUsersPathTemplate { get; set; } = "messenger/friendships/blocked-users";

    public string AuthRegisterPathTemplate { get; set; } = "auth/register";

    public string AuthLoginPathTemplate { get; set; } = "auth/login";

    public string AuthSendVerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/verify-email";

    public string AuthSendVerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/verify-email";

    public string AuthSendChangeUsernameOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/change-username";

    public string AuthSendChangePhoneNumberOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/change-phone-number";

    public string AuthVerifyChangeUsernameOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/change-username";

    public string AuthVerifyChangePhoneNumberOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/change-phone-number";

    public string AuthSendResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/reset-password";

    public string AuthSendResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/reset-password";

    public string AuthVerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/email";

    public string AuthVerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/email";

    public string AuthVerifyResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/password";

    public string AuthVerifyResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/password";

    public string AuthResetPasswordPathTemplate { get; set; } = "auth/reset-password";
}

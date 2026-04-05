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

    public string ProfileMeUpdatePathTemplate { get; set; } = "profiles/me";

    public string ProfileSearchByPhonePathTemplate { get; set; } = "profiles/search?phoneNumber={phoneNumber}";

    public string FriendsByUserIdPathTemplate { get; set; } = "friendships?userId={userId}";

    public string UserSuggestionsPathTemplate { get; set; } = "users/suggestions?page={page}&size={size}";

    public string MessengerPendingRequestersPathTemplate { get; set; } = "messenger/friendships/pending-requesters";

    public string MessengerContactsByUserPathTemplate { get; set; } = "messenger/contacts/getByUser";

    public string MessengerSendFriendRequestPathTemplate { get; set; } = "messenger/friendships";

    public string MessengerAcceptFriendRequestPathTemplate { get; set; } = "messenger/friendships/accept";

    public string MessengerRejectFriendRequestPathTemplate { get; set; } = "messenger/friendships/reject";

    public string MessengerUnfriendPathTemplate { get; set; } = "messenger/friendships";

    public string AuthRegisterPathTemplate { get; set; } = "auth/register";

    public string AuthLoginPathTemplate { get; set; } = "auth/login";

    public string AuthSendVerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/verify-email";

    public string AuthSendVerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/verify-email";

    public string AuthSendResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/reset-password";

    public string AuthSendResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/reset-password";

    public string AuthVerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/email";

    public string AuthVerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/email";

    public string AuthVerifyResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/password";

    public string AuthVerifyResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/password";

    public string AuthResetPasswordPathTemplate { get; set; } = "auth/reset-password";
}

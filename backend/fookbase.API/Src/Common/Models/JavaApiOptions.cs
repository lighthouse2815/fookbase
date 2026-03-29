namespace InteractHub.Api.Common.Models;

public class JavaApiOptions
{
    public const string SectionName = "JavaApi";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string UserByIdPathTemplate { get; set; } = "users/{id}";

    public string ProfileByUserIdPathTemplate { get; set; } = "profiles/public?userId={userId}";

    public string FriendsByUserIdPathTemplate { get; set; } = "friendships?userId={userId}";

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

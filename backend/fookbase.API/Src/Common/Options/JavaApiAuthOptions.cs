namespace InteractHub.Api.Common.Options;

public class JavaApiAuthOptions
{
    public const string SectionName = "JavaApi:Auth";

    public string BaseUrl { get; set; } = "http://localhost:8080/api";

    public string RegisterPathTemplate { get; set; } = "auth/register";

    public string LoginPathTemplate { get; set; } = "auth/login";

    public string GooglePathTemplate { get; set; } = "auth/google";

    public string RefreshTokenPathTemplate { get; set; } = "auth/refresh-token";

    public string LogoutPathTemplate { get; set; } = "auth/logout";

    public string SendVerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/verify-email";

    public string SendVerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/verify-email";

    public string SendChangeUsernameOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/change-username";

    public string SendChangePhoneNumberOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/change-phone-number";

    public string VerifyChangeUsernameOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/change-username";

    public string VerifyChangePhoneNumberOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/change-phone-number";

    public string SendResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/send/reset-password";

    public string SendResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/send/reset-password";

    public string VerifyEmailOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/email";

    public string VerifyEmailOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/email";

    public string VerifyResetPasswordOtpWhenNotLoginPathTemplate { get; set; } = "auth/otp/verify/password";

    public string VerifyResetPasswordOtpWhenLoginPathTemplate { get; set; } = "auth/me/otp/verify/password";

    public string ResetPasswordPathTemplate { get; set; } = "auth/reset-password";
}

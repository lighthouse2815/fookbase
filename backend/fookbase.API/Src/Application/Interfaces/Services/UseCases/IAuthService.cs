using InteractHub.Api.Application.DTOs.Auth;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken);

    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken);

    Task<GoogleAuthResponseDto> AuthWithGoogleAsync(
        GoogleTokenRequestDto request,
        CancellationToken cancellationToken);

    Task<LoginResponseDto> AdminLoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken);

    Task<TokenResponseDto> RefreshTokenAsync(
        string? refreshTokenFromBody,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendVerifyEmailOtpWhenLoginAsync(
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendChangeUsernameOtpWhenLoginAsync(
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendChangePhoneNumberOtpWhenLoginAsync(
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyChangeUsernameOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyChangePhoneNumberOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendResetPasswordOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> SendResetPasswordOtpWhenLoginAsync(
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyEmailOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyEmailOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyResetPasswordOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<OtpVerifyResponseDto> VerifyResetPasswordOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken);

    Task<MessageResponseDto> ResetPasswordAsync(
        string? resetToken,
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken);

    Task LogoutAsync(
        string? refreshTokenFromBody,
        CancellationToken cancellationToken);
}

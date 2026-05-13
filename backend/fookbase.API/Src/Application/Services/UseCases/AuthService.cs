using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Services;

public class AuthService : IAuthService
{
    private readonly IJavaAuthApiService _javaAuthApiService;
    private readonly ITokenRoleService _tokenRoleService;
    private readonly IAuthCookieService _authCookieService;
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        IJavaAuthApiService javaAuthApiService,
        ITokenRoleService tokenRoleService,
        IAuthCookieService authCookieService,
        IAccessTokenProvider accessTokenProvider,
        IHttpContextAccessor httpContextAccessor)
    {
        _javaAuthApiService = javaAuthApiService;
        _tokenRoleService = tokenRoleService;
        _authCookieService = authCookieService;
        _accessTokenProvider = accessTokenProvider;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<RegisterResponseDto> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.RegisterAsync(request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Register failed.");
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.LoginAsync(request, cancellationToken);
        var data = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Login failed.");

        var normalizedToken = data.Token.NormalizeAccessTokenOrNull();
        data.Token = normalizedToken;
        data.AccessToken = normalizedToken;

        SetLoginCookiesIfPossible(normalizedToken, data.RefreshToken);
        return data;
    }

    public async Task<GoogleAuthResponseDto> AuthWithGoogleAsync(
        GoogleTokenRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.AuthWithGoogleAsync(request, cancellationToken);
        var data = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Google authentication failed.");

        var normalizedToken = (data.AccessToken ?? data.Token).NormalizeAccessTokenOrNull();
        data.AccessToken = normalizedToken;
        data.Token = normalizedToken;

        SetLoginCookiesIfPossible(normalizedToken, data.RefreshToken);
        return data;
    }

    public async Task<LoginResponseDto> AdminLoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.LoginAsync(request, cancellationToken);
        var data = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Admin login failed.");

        var normalizedToken = data.Token.NormalizeAccessTokenOrNull();
        data.Token = normalizedToken;
        data.AccessToken = normalizedToken;

        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            throw new BusinessException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        if (!_tokenRoleService.IsAdmin(data.Role, normalizedToken))
        {
            throw new BusinessException(ErrorCode.ADMIN_PERMISSION_REQUIRED);
        }

        SetLoginCookiesIfPossible(normalizedToken, data.RefreshToken);
        return data;
    }

    public async Task<TokenResponseDto> RefreshTokenAsync(
        string? refreshTokenFromBody,
        CancellationToken cancellationToken)
    {
        var refreshToken = ResolveRefreshToken(refreshTokenFromBody);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        var result = await _javaAuthApiService.RefreshTokenAsync(refreshToken, cancellationToken);
        var data = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Refresh token failed.");

        var normalizedToken = (data.AccessToken ?? data.Token).NormalizeAccessTokenOrNull();
        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            throw new BusinessException(
                ErrorCode.UPSTREAM_SERVICE_ERROR,
                "Java auth API returned an invalid access token.");
        }

        data.AccessToken = normalizedToken;
        data.Token = normalizedToken;

        SetLoginCookiesIfPossible(normalizedToken, data.RefreshToken);
        return data;
    }

    public async Task<OtpVerifyResponseDto> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.SendVerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send verify email OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> SendVerifyEmailOtpWhenLoginAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.SendVerifyEmailOtpWhenLoginAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send verify email OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> SendChangeUsernameOtpWhenLoginAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.SendChangeUsernameOtpWhenLoginAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send change username OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> SendChangePhoneNumberOtpWhenLoginAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.SendChangePhoneNumberOtpWhenLoginAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send change phone number OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyChangeUsernameOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.VerifyChangeUsernameOtpWhenLoginAsync(request, accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify change username OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyChangePhoneNumberOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.VerifyChangePhoneNumberOtpWhenLoginAsync(request, accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify change phone number OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> SendResetPasswordOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.SendResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send reset password OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> SendResetPasswordOtpWhenLoginAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.SendResetPasswordOtpWhenLoginAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Send reset password OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyEmailOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.VerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify email OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyEmailOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.VerifyEmailOtpWhenLoginAsync(request, accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify email OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyResetPasswordOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaAuthApiService.VerifyResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify reset password OTP failed.");
    }

    public async Task<OtpVerifyResponseDto> VerifyResetPasswordOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaAuthApiService.VerifyResetPasswordOtpWhenLoginAsync(request, accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Verify reset password OTP failed.");
    }

    public async Task<MessageResponseDto> ResetPasswordAsync(
        string? resetToken,
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var normalizedResetToken = resetToken?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedResetToken))
        {
            throw new BusinessException(ErrorCode.RESET_TOKEN_HEADER_REQUIRED);
        }

        var result = await _javaAuthApiService.ResetPasswordAsync(normalizedResetToken, request, cancellationToken);
        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(result, "Reset password failed.");
    }

    public async Task LogoutAsync(
        string? refreshTokenFromBody,
        CancellationToken cancellationToken)
    {
        var refreshToken = ResolveRefreshToken(refreshTokenFromBody);
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _javaAuthApiService.LogoutAsync(refreshToken, cancellationToken);
        }

        ClearLoginCookiesIfPossible();
    }

    private string? ResolveRefreshToken(string? refreshTokenFromBody)
    {
        if (!string.IsNullOrWhiteSpace(refreshTokenFromBody))
        {
            return refreshTokenFromBody.Trim();
        }

        if (_httpContextAccessor.HttpContext?.Request.Cookies.TryGetValue(
                AuthCookieConstants.RefreshTokenCookieName,
                out var refreshTokenFromCookie) == true
            && !string.IsNullOrWhiteSpace(refreshTokenFromCookie))
        {
            return refreshTokenFromCookie.Trim();
        }

        return null;
    }

    private void SetLoginCookiesIfPossible(string? accessToken, string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return;
        }

        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return;
        }

        _authCookieService.SetLoginCookies(httpContext, accessToken, refreshToken);
    }

    private void ClearLoginCookiesIfPossible()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return;
        }

        _authCookieService.ClearLoginCookies(httpContext);
    }
}

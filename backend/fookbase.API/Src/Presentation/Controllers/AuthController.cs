using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IJavaApiService _javaApiService;
    private readonly ITokenRoleService _tokenRoleService;
    private readonly IAuthCookieService _authCookieService;

    public AuthController(
        IJavaApiService javaApiService,
        ITokenRoleService tokenRoleService,
        IAuthCookieService authCookieService)
    {
        _javaApiService = javaApiService;
        _tokenRoleService = tokenRoleService;
        _authCookieService = authCookieService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<RegisterResponseDto>>> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.RegisterAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<RegisterResponseDto>(result, "Register failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<RegisterResponseDto>.Ok(result.Data));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<LoginResponseDto>(result, "Login failed.");
        }

        var normalizedToken = result.Data.Token.NormalizeAccessTokenOrNull();
        result.Data.Token = normalizedToken;
        result.Data.AccessToken = normalizedToken;

        if (!string.IsNullOrWhiteSpace(normalizedToken))
        {
            _authCookieService.SetLoginCookies(HttpContext, normalizedToken, result.Data.RefreshToken);
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<LoginResponseDto>.Ok(result.Data));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<GoogleAuthResponseDto>>> AuthWithGoogle(
        [FromBody] GoogleTokenRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.AuthWithGoogleAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<GoogleAuthResponseDto>(result, "Google authentication failed.");
        }

        var normalizedToken = (result.Data.AccessToken ?? result.Data.Token).NormalizeAccessTokenOrNull();
        result.Data.AccessToken = normalizedToken;
        result.Data.Token = normalizedToken;

        if (!string.IsNullOrWhiteSpace(normalizedToken))
        {
            _authCookieService.SetLoginCookies(HttpContext, normalizedToken, result.Data.RefreshToken);
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<GoogleAuthResponseDto>.Ok(result.Data));
    }

    [HttpPost("admin/login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> AdminLogin(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<LoginResponseDto>(result, "Admin login failed.");
        }

        var normalizedToken = result.Data.Token.NormalizeAccessTokenOrNull();
        result.Data.Token = normalizedToken;
        result.Data.AccessToken = normalizedToken;

        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            return ErrorResponse<LoginResponseDto>(
                ErrorCode.ADMIN_LOGIN_FAILED,
                StatusCodes.Status403Forbidden,
                "Admin login failed.");
        }

        if (!_tokenRoleService.IsAdmin(result.Data.Role, normalizedToken))
        {
            return ErrorResponse<LoginResponseDto>(
                ErrorCode.ADMIN_PERMISSION_REQUIRED,
                StatusCodes.Status403Forbidden,
                "This account does not have admin permission.");
        }

        _authCookieService.SetLoginCookies(HttpContext, normalizedToken, result.Data.RefreshToken);
        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<LoginResponseDto>.Ok(result.Data));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> RefreshToken(
        [FromBody] RefreshTokenRequestDto? request,
        CancellationToken cancellationToken)
    {
        var refreshToken = ResolveRefreshToken(request?.RefreshToken);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return UnauthorizedApiResponse<TokenResponseDto>();
        }

        var result = await _javaApiService.RefreshTokenAsync(refreshToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<TokenResponseDto>(result, "Refresh token failed.");
        }

        var normalizedToken = (result.Data.AccessToken ?? result.Data.Token).NormalizeAccessTokenOrNull();
        if (string.IsNullOrWhiteSpace(normalizedToken))
        {
            return BuildErrorResponse<TokenResponseDto>(
                StatusCodes.Status502BadGateway,
                "Java auth API returned an invalid access token.",
                "Refresh token failed.");
        }

        result.Data.AccessToken = normalizedToken;
        result.Data.Token = normalizedToken;
        _authCookieService.SetLoginCookies(HttpContext, normalizedToken, result.Data.RefreshToken);

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<TokenResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/send/verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.SendVerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send verify email OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/verify-email")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.SendVerifyEmailOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send verify email OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/change-username")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendChangeUsernameOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.SendChangeUsernameOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send change username OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/change-phone-number")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendChangePhoneNumberOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.SendChangePhoneNumberOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send change phone number OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/change-username")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyChangeUsernameOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.VerifyChangeUsernameOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify change username OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/change-phone-number")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyChangePhoneNumberOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.VerifyChangePhoneNumberOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify change phone number OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/send/reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.SendResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send reset password OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/reset-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.SendResetPasswordOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send reset password OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/verify/email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.VerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify email OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/email")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.VerifyEmailOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify email OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/verify/password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.VerifyResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify reset password OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!TryExtractAccessToken(out var accessToken))
        {
            return UnauthorizedApiResponse<OtpVerifyResponseDto>();
        }

        var result = await _javaApiService.VerifyResetPasswordOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify reset password OTP failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<MessageResponseDto>>> ResetPassword(
        [FromHeader(Name = "X-Reset-Token")] string? resetToken,
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(resetToken))
        {
            return ErrorResponse<MessageResponseDto>(
                ErrorCode.RESET_TOKEN_HEADER_REQUIRED,
                StatusCodes.Status400BadRequest,
                "X-Reset-Token header is required.");
        }

        var result = await _javaApiService.ResetPasswordAsync(resetToken, request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<MessageResponseDto>(result, "Reset password failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<MessageResponseDto>.Ok(result.Data));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> Logout(
        [FromBody] LogoutRequestDto? request,
        CancellationToken cancellationToken)
    {
        var refreshToken = ResolveRefreshToken(request?.RefreshToken);
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _javaApiService.LogoutAsync(refreshToken, cancellationToken);
        }

        _authCookieService.ClearLoginCookies(HttpContext);
        return NoContent();
    }

    private string? ResolveRefreshToken(string? refreshTokenFromBody)
    {
        if (!string.IsNullOrWhiteSpace(refreshTokenFromBody))
        {
            return refreshTokenFromBody.Trim();
        }

        if (Request.Cookies.TryGetValue(AuthCookieConstants.RefreshTokenCookieName, out var refreshTokenFromCookie)
            && !string.IsNullOrWhiteSpace(refreshTokenFromCookie))
        {
            return refreshTokenFromCookie.Trim();
        }

        return null;
    }
}

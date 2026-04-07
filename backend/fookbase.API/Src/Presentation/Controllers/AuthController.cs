using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IJavaApiService _javaApiService;

    public AuthController(IJavaApiService javaApiService)
    {
        _javaApiService = javaApiService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<RegisterResponseDto>>> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.RegisterAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<RegisterResponseDto>(result, "Register failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<RegisterResponseDto>.Ok(result.Data));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<LoginResponseDto>(result, "Login failed.");
        }

        result.Data.Token = NormalizeAccessToken(result.Data.Token);
        SetAccessTokenCookie(result.Data.Token);
        SetUserIdCookie(result.Data.UserId);
        return StatusCode(result.StatusCode, ApiResponse<LoginResponseDto>.Ok(result.Data));
    }

    [HttpPost("admin/login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> AdminLogin(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<LoginResponseDto>(result, "Admin login failed.");
        }

        result.Data.Token = NormalizeAccessToken(result.Data.Token);

        if (!IsAdminToken(result.Data))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<LoginResponseDto>.Fail("This account does not have admin permission."));
        }

        SetAccessTokenCookie(result.Data.Token);
        SetUserIdCookie(result.Data.UserId);
        return StatusCode(result.StatusCode, ApiResponse<LoginResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/send/verify-email")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.SendVerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send verify email OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/verify-email")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var accessToken = Request.ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<OtpVerifyResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.SendVerifyEmailOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send verify email OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/send/reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.SendResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send reset password OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/send/reset-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var accessToken = Request.ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<OtpVerifyResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.SendResetPasswordOtpWhenLoginAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Send reset password OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/verify/email")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.VerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify email OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/email")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = Request.ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<OtpVerifyResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.VerifyEmailOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify email OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("otp/verify/password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _javaApiService.VerifyResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify reset password OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("me/otp/verify/password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<OtpVerifyResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = Request.ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<OtpVerifyResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.VerifyResetPasswordOtpWhenLoginAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<OtpVerifyResponseDto>(result, "Verify reset password OTP failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<OtpVerifyResponseDto>.Ok(result.Data));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<MessageResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<MessageResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<MessageResponseDto>>> ResetPassword(
        [FromHeader(Name = "X-Reset-Token")] string? resetToken,
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(resetToken))
        {
            return BadRequest(ApiResponse<MessageResponseDto>.Fail("X-Reset-Token header is required."));
        }

        var result = await _javaApiService.ResetPasswordAsync(resetToken, request, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<MessageResponseDto>(result, "Reset password failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<MessageResponseDto>.Ok(result.Data));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public ActionResult Logout()
    {
        Response.Cookies.Delete(AuthCookieConstants.AccessTokenCookieName, CreateAuthCookieOptions());
        Response.Cookies.Delete(AuthCookieConstants.UserIdCookieName, CreateAuthCookieOptions());
        return NoContent();
    }

    private ActionResult<ApiResponse<T>> BuildErrorResponse<T>(JavaApiCallResult<T> result, string fallbackError)
    {
        var statusCode = result.StatusCode > 0
            ? result.StatusCode
            : StatusCodes.Status502BadGateway;

        var error = string.IsNullOrWhiteSpace(result.ErrorMessage)
            ? fallbackError
            : result.ErrorMessage;

        return StatusCode(statusCode, ApiResponse<T>.Fail(error));
    }

    private void SetAccessTokenCookie(string token)
    {
        token = NormalizeAccessToken(token);

        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        var cookieOptions = CreateAuthCookieOptions();
        var expiration = TryReadJwtExpiration(token);

        if (expiration.HasValue)
        {
            cookieOptions.Expires = expiration.Value;
        }

        Response.Cookies.Append(AuthCookieConstants.AccessTokenCookieName, token, cookieOptions);
    }

    private CookieOptions CreateAuthCookieOptions()
    {
        var isHttps = HttpContext.Request.IsHttps;
        var sameSiteMode = isHttps ? SameSiteMode.None : SameSiteMode.Lax;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = sameSiteMode,
            Path = "/",
            IsEssential = true
        };
    }

    private static DateTimeOffset? TryReadJwtExpiration(string token)
    {
        try
        {
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(token);
            return jwtToken.ValidTo == DateTime.MinValue
                ? null
                : new DateTimeOffset(jwtToken.ValidTo, TimeSpan.Zero);
        }
        catch (ArgumentException)
        {
            return null;
        }
    }

    private static string NormalizeAccessToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return string.Empty;
        }

        var normalized = token.Trim();
        const string bearerPrefix = "Bearer ";

        if (normalized.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return normalized[bearerPrefix.Length..].Trim();
        }

        return normalized;
    }

    private static bool IsAdminToken(LoginResponseDto payload)
    {
        if (string.Equals(payload.Role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(payload.Token))
        {
            return false;
        }

        try
        {
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(payload.Token);
            var roleClaims = jwtToken.Claims
                .Where(claim =>
                    claim.Type == ClaimTypes.Role
                    || claim.Type == "role"
                    || claim.Type == "roles"
                    || claim.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                    || claim.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role")
                .Select(claim => claim.Value);

            return roleClaims.Any(role => string.Equals(role, AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private void SetUserIdCookie(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        var cookieOptions = CreateAuthCookieOptions();
        Response.Cookies.Append(AuthCookieConstants.UserIdCookieName, userId.ToString(), cookieOptions);
    }
}

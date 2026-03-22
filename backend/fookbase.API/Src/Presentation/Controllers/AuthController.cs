using System.IdentityModel.Tokens.Jwt;
using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
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

        SetAccessTokenCookie(result.Data.Token);
        return StatusCode(result.StatusCode, ApiResponse<LoginResponseDto>.Ok(result.Data));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public ActionResult Logout()
    {
        Response.Cookies.Delete(AuthCookieConstants.AccessTokenCookieName, CreateAuthCookieOptions());
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
}

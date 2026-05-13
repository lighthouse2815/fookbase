using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<RegisterResponseDto>>> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(ApiResponse<RegisterResponseDto>.Ok(response));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(ApiResponse<LoginResponseDto>.Ok(response));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<GoogleAuthResponseDto>>> AuthWithGoogle(
        [FromBody] GoogleTokenRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.AuthWithGoogleAsync(request, cancellationToken);
        return Ok(ApiResponse<GoogleAuthResponseDto>.Ok(response));
    }

    [HttpPost("admin/login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> AdminLogin(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.AdminLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<LoginResponseDto>.Ok(response));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TokenResponseDto>>> RefreshToken(
        [FromBody] RefreshTokenRequestDto? request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RefreshTokenAsync(request?.RefreshToken, cancellationToken);
        return Ok(ApiResponse<TokenResponseDto>.Ok(response));
    }

    [HttpPost("otp/send/verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendVerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/send/verify-email")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendVerifyEmailOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendVerifyEmailOtpWhenLoginAsync(cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/send/change-username")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendChangeUsernameOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendChangeUsernameOtpWhenLoginAsync(cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/send/change-phone-number")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendChangePhoneNumberOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendChangePhoneNumberOtpWhenLoginAsync(cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/verify/change-username")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyChangeUsernameOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyChangeUsernameOtpWhenLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/verify/change-phone-number")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyChangePhoneNumberOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyChangePhoneNumberOtpWhenLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("otp/send/reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenNotLogin(
        [FromBody] OtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/send/reset-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> SendResetPasswordOtpWhenLogin(
        CancellationToken cancellationToken)
    {
        var response = await _authService.SendResetPasswordOtpWhenLoginAsync(cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("otp/verify/email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyEmailOtpWhenNotLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/verify/email")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyEmailOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyEmailOtpWhenLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("otp/verify/password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenNotLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyResetPasswordOtpWhenNotLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("me/otp/verify/password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OtpVerifyResponseDto>>> VerifyResetPasswordOtpWhenLogin(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.VerifyResetPasswordOtpWhenLoginAsync(request, cancellationToken);
        return Ok(ApiResponse<OtpVerifyResponseDto>.Ok(response));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<MessageResponseDto>>> ResetPassword(
        [FromHeader(Name = "X-Reset-Token")] string? resetToken,
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.ResetPasswordAsync(resetToken, request, cancellationToken);
        return Ok(ApiResponse<MessageResponseDto>.Ok(response));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> Logout(
        [FromBody] LogoutRequestDto? request,
        CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request?.RefreshToken, cancellationToken);
        return NoContent();
    }
}




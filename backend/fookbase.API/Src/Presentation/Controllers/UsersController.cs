using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly ICurrentUserService _currentUserService;

    public UsersController(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<CurrentUserResponseDto>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var accessToken = ExtractAccessToken();
        var result = await _currentUserService.GetCurrentUserAsync(userId, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<CurrentUserResponseDto>(result, "Load current user failed.");
        }

        return StatusCode(
            ResolveSuccessStatusCode(result.StatusCode),
            ApiResponse<CurrentUserResponseDto>.Ok(result.Data));
    }

    [HttpGet("me/security-account")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<SecurityAccountInfoResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SecurityAccountInfoResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<SecurityAccountInfoResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<SecurityAccountInfoResponseDto>>> GetMySecurityAccountInfo(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var accessToken = ExtractAccessToken();
        var usernameFromClaims = User.GetUsernameOrNull();
        var result = await _currentUserService.GetSecurityAccountInfoAsync(
            userId,
            accessToken,
            usernameFromClaims,
            cancellationToken);

        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<SecurityAccountInfoResponseDto>(result, "Load security account info failed.");
        }

        return StatusCode(
            ResolveSuccessStatusCode(result.StatusCode),
            ApiResponse<SecurityAccountInfoResponseDto>.Ok(result.Data));
    }

    [HttpPatch("me/security-account")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateMySecurityAccountInfo(
        [FromBody] UpdateSecurityAccountRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();
        var result = await _currentUserService.UpdateSecurityAccountInfoAsync(
            request,
            accessToken,
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Update security account info failed.");
        }

        return NoContent();
    }
}


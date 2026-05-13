using InteractHub.Api.Application.DTOs.Common;
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
    public async Task<ActionResult<ApiResponse<CurrentUserResponseDto>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var response = await _currentUserService.GetCurrentUserAsync(userId, cancellationToken);

        return Ok(ApiResponse<CurrentUserResponseDto>.Ok(response));
    }

    [HttpGet("me/security-account")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SecurityAccountInfoResponseDto>>> GetMySecurityAccountInfo(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var usernameFromClaims = User.GetUsernameOrNull();
        var response = await _currentUserService.GetSecurityAccountInfoAsync(
            userId,
            usernameFromClaims,
            cancellationToken);

        return Ok(ApiResponse<SecurityAccountInfoResponseDto>.Ok(response));
    }

    [HttpPatch("me/security-account")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> UpdateMySecurityAccountInfo(
        [FromHeader(Name = "X-Reset-Token")] string? resetToken,
        [FromBody] UpdateSecurityAccountRequestDto request,
        CancellationToken cancellationToken)
    {
        await _currentUserService.UpdateSecurityAccountInfoAsync(
            resetToken,
            request,
            cancellationToken);

        return NoContent();
    }
}







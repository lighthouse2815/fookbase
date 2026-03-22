using System.Net;
using System.Security.Claims;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IJavaApiService _javaApiService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IJavaApiService javaApiService, ILogger<UsersController> logger)
    {
        _javaApiService = javaApiService;
        _logger = logger;
    }

    [HttpGet("me")]
    [Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<CurrentUserResponseDto>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var accessToken = ExtractAccessToken();
        var usernameFromClaims = ResolveUsernameFromClaims();

        try
        {
            var userTask = _javaApiService.GetUserById(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);
            var profileTask = _javaApiService.GetProfileByUserId(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            await Task.WhenAll(userTask, profileTask);

            var user = userTask.Result;
            var profile = profileTask.Result;

            if (user is null && profile is null)
            {
                return NotFound(ApiResponse<CurrentUserResponseDto>.Fail("User profile not found."));
            }

            var username = user?.Username ?? usernameFromClaims;
            var fullName = profile?.DisplayName ?? profile?.FullName ?? username;

            var response = new CurrentUserResponseDto
            {
                Id = userId,
                Username = username,
                FullName = fullName,
                AvatarUrl = profile?.AvatarUrl ?? BuildDefaultAvatarUrl(userId)
            };

            return Ok(ApiResponse<CurrentUserResponseDto>.Ok(response));
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogWarning(exception, "Java profile API rejected token for user {UserId}.", userId);
            return Unauthorized(ApiResponse<CurrentUserResponseDto>.Fail("Unauthorized."));
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java profile API is unavailable when loading /api/users/me for user {UserId}.", userId);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<CurrentUserResponseDto>.Fail("Java profile API is unavailable."));
        }
    }

    private string ResolveUsernameFromClaims()
    {
        return User.FindFirstValue("username")
            ?? User.FindFirstValue("preferred_username")
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue("name")
            ?? "user";
    }

    private string? ExtractAccessToken()
    {
        var authorizationHeader = Request.Headers.Authorization.ToString();
        if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authorizationHeader["Bearer ".Length..].Trim();
        }

        if (Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken;
        }

        return null;
    }

    private static string BuildDefaultAvatarUrl(Guid userId)
    {
        return $"https://i.pravatar.cc/150?u={userId}";
    }
}

using System.Net;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public class ProfilesController : ControllerBase
{
    private readonly IJavaApiService _javaApiService;
    private readonly ILogger<ProfilesController> _logger;

    public ProfilesController(IJavaApiService javaApiService, ILogger<ProfilesController> logger)
    {
        _javaApiService = javaApiService;
        _logger = logger;
    }

    [HttpGet("{userId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ProfileResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProfileResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<ProfileResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<ProfileResponseDto>>> GetByUserId(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();

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
                return NotFound(ApiResponse<ProfileResponseDto>.Fail("Profile not found."));
            }

            var username = user?.Username ?? "user";
            var fullName = profile?.DisplayName ?? profile?.FullName ?? username;

            var response = new ProfileResponseDto
            {
                Id = userId,
                Username = username,
                FullName = fullName,
                AvatarUrl = profile?.AvatarUrl ?? BuildDefaultAvatarUrl(userId),
                Bio = profile?.Bio,
                CoverUrl = profile?.CoverUrl,
                Major = profile?.Major,
                Year = profile?.Year,
                FriendsCount = 0,
                PostsCount = 0
            };

            return Ok(ApiResponse<ProfileResponseDto>.Ok(response));
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogWarning(exception, "Java profile API rejected token for user {UserId}.", userId);
            return Unauthorized(ApiResponse<ProfileResponseDto>.Fail("Unauthorized."));
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java profile API is unavailable when loading profile for user {UserId}.", userId);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<ProfileResponseDto>.Fail("Java profile API is unavailable."));
        }
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


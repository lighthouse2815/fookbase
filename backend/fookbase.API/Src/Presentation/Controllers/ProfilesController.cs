using System.Net;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
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

            var fullName = profile?.DisplayName ?? profile?.FullName ?? "user";

            var response = new ProfileResponseDto
            {
                Id = userId,
                FullName = fullName,
                AvatarUrl = profile?.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId),
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

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<MyProfileSettingsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MyProfileSettingsResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<MyProfileSettingsResponseDto>>> GetMyProfileSettings(
        CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<MyProfileSettingsResponseDto>.Fail("Unauthorized."));
        }

        var userId = User.GetUserId();

        try
        {
            var privateProfileTask = _javaApiService.GetPrivateProfileByUserIdAsync(userId, accessToken, cancellationToken);
            var overviewTask = _javaApiService.GetMyProfileOverviewAsync(accessToken, cancellationToken);

            await Task.WhenAll(privateProfileTask, overviewTask);

            var privateProfile = privateProfileTask.Result.Data;
            var overview = overviewTask.Result.Data;

            var displayName = FirstNonEmpty(
                privateProfile?.DisplayName,
                overview?.DisplayName,
                "user");

            var response = new MyProfileSettingsResponseDto
            {
                UserId = userId,
                DisplayName = displayName ?? "user",
                Email = overview?.Email,
                PhoneNumber = FirstNonEmpty(privateProfile?.PhoneNumber, overview?.PhoneNumber),
                AvatarUrl = privateProfile?.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId),
                BirthDate = FirstNonEmpty(privateProfile?.BirthDate, overview?.BirthDate),
                Gender = privateProfile?.Gender
            };

            return Ok(ApiResponse<MyProfileSettingsResponseDto>.Ok(response));
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogWarning(exception, "Java profile API rejected token for user {UserId}.", userId);
            return Unauthorized(ApiResponse<MyProfileSettingsResponseDto>.Fail("Unauthorized."));
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java profile API is unavailable when loading my profile settings for user {UserId}.", userId);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<MyProfileSettingsResponseDto>.Fail("Java profile API is unavailable."));
        }
    }

    [HttpPatch("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateMyProfile(
        [FromBody] UpdateMyProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<object>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.UpdateMyProfileAsync(request, accessToken, cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildProxyErrorResponse<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Update profile failed.");
        }

        return NoContent();
    }

    [HttpGet("search")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<UserProfileSearchDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<UserProfileSearchDto>>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<List<UserProfileSearchDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<UserProfileSearchDto>>>> SearchByPhoneNumber(
        [FromQuery] string phoneNumber,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return BadRequest(ApiResponse<List<UserProfileSearchDto>>.Fail("phoneNumber is required."));
        }

        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<List<UserProfileSearchDto>>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.SearchProfileByPhoneNumberAsync(phoneNumber.Trim(), accessToken, cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildProxyErrorResponse<List<UserProfileSearchDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Search profile failed.");
        }

        var profiles = result.Data is null
            ? new List<UserProfileSearchDto>()
            : new List<UserProfileSearchDto> { result.Data };

        var statusCode = result.StatusCode > 0
            ? result.StatusCode
            : StatusCodes.Status200OK;

        return StatusCode(statusCode, ApiResponse<List<UserProfileSearchDto>>.Ok(profiles));
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

    private ActionResult<ApiResponse<T>> BuildProxyErrorResponse<T>(
        int statusCode,
        string? errorMessage,
        string fallbackError)
    {
        var resolvedStatusCode = statusCode > 0
            ? statusCode
            : StatusCodes.Status502BadGateway;

        var resolvedError = string.IsNullOrWhiteSpace(errorMessage)
            ? fallbackError
            : errorMessage;

        return StatusCode(resolvedStatusCode, ApiResponse<T>.Fail(resolvedError));
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }
}


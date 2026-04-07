using System.Net;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Utilities;
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
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<ApiResponse<CurrentUserResponseDto>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var accessToken = Request.ExtractAccessToken();

        try
        {
            var profileTask = _javaApiService.GetProfileSummaryByUserId(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            await Task.WhenAll(profileTask);
            var profile = profileTask.Result;

            if (profile is null)
            {
                return NotFound(ApiResponse<CurrentUserResponseDto>.Fail("User profile not found."));
            }

            var fullName = profile.DisplayName ?? "user";

            var response = new CurrentUserResponseDto
            {
                Id = userId,
                FullName = fullName,
                AvatarUrl = profile.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
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
}


using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public class ProfilesController : ApiControllerBase
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
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
        var result = await _profileService.GetByUserIdAsync(userId, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<ProfileResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Profile not found.");
        }

        return Ok(ApiResponse<ProfileResponseDto>.Ok(result.Data));
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<MyProfileSettingsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MyProfileSettingsResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<MyProfileSettingsResponseDto>>> GetMyProfileSettings(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var result = await _profileService.GetMyProfileSettingsAsync(userId, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<MyProfileSettingsResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Load my profile settings failed.");
        }

        return Ok(ApiResponse<MyProfileSettingsResponseDto>.Ok(result.Data));
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
        var result = await _profileService.UpdateMyProfileAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(
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
        var result = await _profileService.SearchByPhoneNumberAsync(phoneNumber, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<UserProfileSearchDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Search profile failed.");
        }

        var statusCode = ResolveSuccessStatusCode(result.StatusCode);

        return StatusCode(statusCode, ApiResponse<List<UserProfileSearchDto>>.Ok(result.Data));
    }
}


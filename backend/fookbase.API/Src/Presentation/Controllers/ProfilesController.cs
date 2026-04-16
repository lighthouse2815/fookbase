using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

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

    [HttpGet("me/page-info")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ProfilePageInfoSettingsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProfilePageInfoSettingsResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<ProfilePageInfoSettingsResponseDto>>> GetMyProfilePageInfoSettings(
        CancellationToken cancellationToken)
    {
        var result = await _profileService.GetMyProfilePageInfoSettingsAsync(ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<ProfilePageInfoSettingsResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Load my profile page info settings failed.");
        }

        return Ok(ApiResponse<ProfilePageInfoSettingsResponseDto>.Ok(result.Data));
    }

    [HttpGet("me/page-info/visibility")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ProfileInfoVisibilityResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ProfileInfoVisibilityResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<ProfileInfoVisibilityResponseDto>>> GetMyProfilePageInfoVisibility(
        CancellationToken cancellationToken)
    {
        var result = await _profileService.GetMyProfilePageInfoVisibilityAsync(ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<ProfileInfoVisibilityResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Load my profile page info visibility failed.");
        }

        return Ok(ApiResponse<ProfileInfoVisibilityResponseDto>.Ok(result.Data));
    }

    [HttpPatch("me/page-info/visibility")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object?>>> UpdateMyProfilePageInfoVisibility(
        [FromBody] UpdateProfileInfoVisibilityRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _profileService.UpdateMyProfilePageInfoVisibilityAsync(
            request,
            ExtractAccessToken(),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Update profile page info visibility failed.");
        }

        return NoContent();
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
    public async Task<ActionResult<ApiResponse<List<UserProfileSearchDto>>>> SearchProfiles(
        [FromQuery] string? keyword,
        [FromQuery] string? phoneNumber,
        [FromQuery] string? displayName,
        CancellationToken cancellationToken)
    {
        var normalizedKeyword = keyword?.Trim();
        var normalizedPhoneNumber = phoneNumber?.Trim();
        var normalizedDisplayName = displayName?.Trim();

        JavaApiCallResult<List<UserProfileSearchDto>> result;

        if (!string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            result = await _profileService.SearchByPhoneNumberAsync(
                normalizedPhoneNumber,
                ExtractAccessToken(),
                cancellationToken);
        }
        else
        {
            var resolvedDisplayName = !string.IsNullOrWhiteSpace(normalizedDisplayName)
                ? normalizedDisplayName
                : normalizedKeyword;

            if (string.IsNullOrWhiteSpace(resolvedDisplayName))
            {
                return BadRequest(ApiResponse<List<UserProfileSearchDto>>.Fail("keyword, phoneNumber, or displayName is required."));
            }

            if (Regex.IsMatch(resolvedDisplayName, "^0\\d{9}$"))
            {
                result = await _profileService.SearchByPhoneNumberAsync(
                    resolvedDisplayName,
                    ExtractAccessToken(),
                    cancellationToken);
            }
            else
            {
                result = await _profileService.SearchByDisplayNameAsync(
                    resolvedDisplayName,
                    ExtractAccessToken(),
                    cancellationToken);
            }
        }

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


using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Enums;
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
    public async Task<ActionResult<ApiResponse<ProfileResponseDto>>> GetByUserId(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var response = await _profileService.GetByUserIdAsync(userId, cancellationToken);
        return Ok(ApiResponse<ProfileResponseDto>.Ok(response));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<MyProfileSettingsResponseDto>>> GetMyProfileSettings(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var response = await _profileService.GetMyProfileSettingsAsync(userId, cancellationToken);
        return Ok(ApiResponse<MyProfileSettingsResponseDto>.Ok(response));
    }

    [HttpGet("me/page-info")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProfilePageInfoSettingsResponseDto>>> GetMyProfilePageInfoSettings(
        CancellationToken cancellationToken)
    {
        var response = await _profileService.GetMyProfilePageInfoSettingsAsync(cancellationToken);
        return Ok(ApiResponse<ProfilePageInfoSettingsResponseDto>.Ok(response));
    }

    [HttpGet("me/page-info/visibility")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProfileInfoVisibilityResponseDto>>> GetMyProfilePageInfoVisibility(
        CancellationToken cancellationToken)
    {
        var response = await _profileService.GetMyProfilePageInfoVisibilityAsync(cancellationToken);
        return Ok(ApiResponse<ProfileInfoVisibilityResponseDto>.Ok(response));
    }

    [HttpPatch("me/page-info/visibility")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> UpdateMyProfilePageInfoVisibility(
        [FromBody] UpdateProfileInfoVisibilityRequestDto request,
        CancellationToken cancellationToken)
    {
        await _profileService.UpdateMyProfilePageInfoVisibilityAsync(
            request,
            cancellationToken);

        return NoContent();
    }

    [HttpPatch("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> UpdateMyProfile(
        [FromBody] UpdateMyProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        await _profileService.UpdateMyProfileAsync(request, cancellationToken);

        return NoContent();
    }

    [HttpGet("search")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<UserProfileSearchDto>>>> SearchProfiles(
        [FromQuery] string? keyword,
        [FromQuery] string? phoneNumber,
        [FromQuery] string? displayName,
        CancellationToken cancellationToken)
    {
        var normalizedKeyword = keyword?.Trim();
        var normalizedPhoneNumber = phoneNumber?.Trim();
        var normalizedDisplayName = displayName?.Trim();

        List<UserProfileSearchDto> profiles;

        if (!string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            profiles = await _profileService.SearchByPhoneNumberAsync(
                normalizedPhoneNumber,
                cancellationToken);
        }
        else
        {
            var resolvedDisplayName = !string.IsNullOrWhiteSpace(normalizedDisplayName)
                ? normalizedDisplayName
                : normalizedKeyword;

            if (string.IsNullOrWhiteSpace(resolvedDisplayName))
            {
                return ErrorResponse<List<UserProfileSearchDto>>(
                    ErrorCode.VALIDATION_ERROR,
                    StatusCodes.Status400BadRequest,
                    "keyword, phoneNumber, or displayName is required.");
            }

            if (Regex.IsMatch(resolvedDisplayName, "^0\\d{9}$"))
            {
                profiles = await _profileService.SearchByPhoneNumberAsync(
                    resolvedDisplayName,
                    cancellationToken);
            }
            else
            {
                profiles = await _profileService.SearchByDisplayNameAsync(
                    resolvedDisplayName,
                    cancellationToken);
            }
        }

        return Ok(ApiResponse<List<UserProfileSearchDto>>.Ok(profiles));
    }
}







using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/java-read")]
public class JavaReadController : ControllerBase
{
    private readonly IJavaApiService _javaApiService;

    public JavaReadController(IJavaApiService javaApiService)
    {
        _javaApiService = javaApiService;
    }

    [HttpGet("users/{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(id, cancellationToken: cancellationToken);
        if (user is null)
        {
            return NotFound(ApiResponse<UserDto>.Fail("User not found."));
        }

        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    [HttpGet("profiles/{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfileByUserId(Guid userId, CancellationToken cancellationToken)
    {
        var profile = await _javaApiService.GetProfileByUserId(userId, cancellationToken: cancellationToken);
        if (profile is null)
        {
            return NotFound(ApiResponse<UserProfileDto>.Fail("Profile not found."));
        }

        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    [HttpGet("friendships/{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FriendshipDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FriendshipDto>>>> GetFriendshipsByUserId(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var friendships = await _javaApiService.GetFriends(userId, cancellationToken: cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<FriendshipDto>>.Ok(friendships));
    }
}

using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/friendships")]
[Authorize]
public class FriendshipsController : ControllerBase
{
    private readonly IJavaApiService _javaApiService;

    public FriendshipsController(IJavaApiService javaApiService)
    {
        _javaApiService = javaApiService;
    }

    [HttpGet("pending-requesters")]
    [ProducesResponseType(typeof(ApiResponse<List<PendingFriendRequesterDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<PendingFriendRequesterDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<PendingFriendRequesterDto>>>> GetPendingRequesters(
        CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<List<PendingFriendRequesterDto>>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.GetPendingRequestersAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<PendingFriendRequesterDto>>(result, "Load pending friend requests failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<List<PendingFriendRequesterDto>>.Ok(result.Data));
    }

    [HttpGet("contacts")]
    [ProducesResponseType(typeof(ApiResponse<List<ContactDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<ContactDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetContacts(CancellationToken cancellationToken)
    {
        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<List<ContactDto>>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.GetContactsByUserAsync(accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<ContactDto>>(result, "Load contacts failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<List<ContactDto>>.Ok(result.Data));
    }

    [HttpPost("request")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> SendFriendRequest(
        [FromBody] SendFriendRequestDto request,
        CancellationToken cancellationToken)
    {
        var targetUserId = ResolveTargetUserId(request.AddresseeId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequest(ApiResponse<FriendshipResponseDto>.Fail("addresseeId or userId is required."));
        }

        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<FriendshipResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.SendFriendRequestAsync(targetUserId, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Send friend request failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("accept")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> AcceptFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var targetUserId = ResolveTargetUserId(request.RequestId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequest(ApiResponse<FriendshipResponseDto>.Fail("requestId or userId is required."));
        }

        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<FriendshipResponseDto>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.AcceptFriendRequestAsync(targetUserId, accessToken, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Accept friend request failed.");
        }

        return StatusCode(result.StatusCode, ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object?>>> RejectFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var targetUserId = ResolveTargetUserId(request.RequestId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequest(ApiResponse<object>.Fail("requestId or userId is required."));
        }

        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<object>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.RejectFriendRequestAsync(targetUserId, accessToken, cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Reject friend request failed.");
        }

        return NoContent();
    }

    [HttpPost("unfriend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object?>>> Unfriend(
        [FromBody] UnfriendActionDto request,
        CancellationToken cancellationToken)
    {
        var targetUserId = ResolveTargetUserId(request.FriendId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequest(ApiResponse<object>.Fail("friendId or userId is required."));
        }

        var accessToken = ExtractAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Unauthorized(ApiResponse<object>.Fail("Unauthorized."));
        }

        var result = await _javaApiService.UnfriendAsync(targetUserId, accessToken, cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Unfriend failed.");
        }

        return NoContent();
    }

    private ActionResult<ApiResponse<T>> BuildErrorResponse<T>(JavaApiCallResult<T> result, string fallbackError)
    {
        var statusCode = result.StatusCode > 0
            ? result.StatusCode
            : StatusCodes.Status502BadGateway;

        var error = string.IsNullOrWhiteSpace(result.ErrorMessage)
            ? fallbackError
            : result.ErrorMessage;

        return StatusCode(statusCode, ApiResponse<T>.Fail(error));
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

    private static string ResolveTargetUserId(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return candidate.Trim();
            }
        }

        return string.Empty;
    }
}

public class SendFriendRequestDto
{
    public string? AddresseeId { get; set; }

    public string? UserId { get; set; }
}

public class FriendRequestActionDto
{
    public string? RequestId { get; set; }

    public string? UserId { get; set; }
}

public class UnfriendActionDto
{
    public string? FriendId { get; set; }

    public string? UserId { get; set; }
}

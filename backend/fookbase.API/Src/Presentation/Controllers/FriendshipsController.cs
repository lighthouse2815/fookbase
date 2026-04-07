using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/friendships")]
[Authorize]
public class FriendshipsController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipsController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    [HttpGet("pending-requesters")]
    [ProducesResponseType(typeof(ApiResponse<List<PendingFriendRequesterDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<PendingFriendRequesterDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<PendingFriendRequesterDto>>>> GetPendingRequesters(
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetPendingRequestersAsync(Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<PendingFriendRequesterDto>>(result, "Load pending friend requests failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<PendingFriendRequesterDto>>.Ok(result.Data));
    }

    [HttpGet("contacts")]
    [ProducesResponseType(typeof(ApiResponse<List<ContactDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<ContactDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetContacts(CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetContactsAsync(Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<ContactDto>>(result, "Load contacts failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<ContactDto>>.Ok(result.Data));
    }

    [HttpGet("presence")]
    [ProducesResponseType(typeof(ApiResponse<List<UserProfilePresenceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<UserProfilePresenceDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<UserProfilePresenceDto>>>> GetFriendPresence(
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetFriendPresenceAsync(Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<UserProfilePresenceDto>>(result, "Load friend presence failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<UserProfilePresenceDto>>.Ok(result.Data));
    }

    [HttpGet("suggestions")]
    [ProducesResponseType(typeof(ApiResponse<List<FriendSuggestionResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<FriendSuggestionResponseDto>>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<List<FriendSuggestionResponseDto>>>> GetSuggestions(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _friendshipService.GetSuggestionsAsync(Request.ExtractAccessToken(), page, pageSize, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<FriendSuggestionResponseDto>>(result, "Load friend suggestions failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<FriendSuggestionResponseDto>>.Ok(result.Data));
    }

    [HttpPost("request")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> SendFriendRequest(
        [FromBody] SendFriendRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.SendFriendRequestAsync(request, Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Send friend request failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("accept")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> AcceptFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.AcceptFriendRequestAsync(request, Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Accept friend request failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object?>>> RejectFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.RejectFriendRequestAsync(request, Request.ExtractAccessToken(), cancellationToken);
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
        var result = await _friendshipService.UnfriendAsync(request, Request.ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Unfriend failed.");
        }

        return NoContent();
    }

    private ActionResult<ApiResponse<T>> BuildErrorResponse<T>(JavaApiCallResult<T> result, string fallbackError)
    {
        var resolvedStatusCode = result.StatusCode > 0
            ? result.StatusCode
            : StatusCodes.Status502BadGateway;
        var resolvedError = string.IsNullOrWhiteSpace(result.ErrorMessage)
            ? fallbackError
            : result.ErrorMessage;

        return StatusCode(resolvedStatusCode, ApiResponse<T>.Fail(resolvedError));
    }

    private static int ResolveSuccessStatusCode(int statusCode)
    {
        return statusCode > 0
            ? statusCode
            : StatusCodes.Status200OK;
    }
}

using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/friendships")]
[Authorize]
public class FriendshipsController : ApiControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipsController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    [HttpGet("pending-requesters")]
    public async Task<ActionResult<ApiResponse<List<PendingFriendRequesterDto>>>> GetPendingRequesters(
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetPendingRequestersAsync(ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<PendingFriendRequesterDto>>(result, "Load pending friend requests failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<PendingFriendRequesterDto>>.Ok(result.Data));
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetContacts(CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetContactsAsync(GetCurrentUserId(), ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<ContactDto>>(result, "Load contacts failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<ContactDto>>.Ok(result.Data));
    }

    [HttpGet("presence")]
    public async Task<ActionResult<ApiResponse<List<UserProfilePresenceDto>>>> GetFriendPresence(
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetFriendPresenceAsync(ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<UserProfilePresenceDto>>(result, "Load friend presence failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<UserProfilePresenceDto>>.Ok(result.Data));
    }

    [HttpGet("suggestions")]
    public async Task<ActionResult<ApiResponse<List<FriendSuggestionResponseDto>>>> GetSuggestions(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _friendshipService.GetSuggestionsAsync(ExtractAccessToken(), page, pageSize, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<FriendSuggestionResponseDto>>(result, "Load friend suggestions failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<FriendSuggestionResponseDto>>.Ok(result.Data));
    }

    [HttpPost("request")]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> SendFriendRequest(
        [FromBody] SendFriendRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.SendFriendRequestAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Send friend request failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("accept")]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> AcceptFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.AcceptFriendRequestAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<FriendshipResponseDto>(result, "Accept friend request failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<FriendshipResponseDto>.Ok(result.Data));
    }

    [HttpPost("reject")]
    public async Task<ActionResult<ApiResponse<object?>>> RejectFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.RejectFriendRequestAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Reject friend request failed.");
        }

        return NoContent();
    }

    [HttpPost("unfriend")]
    public async Task<ActionResult<ApiResponse<object?>>> Unfriend(
        [FromBody] UnfriendActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.UnfriendAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Unfriend failed.");
        }

        return NoContent();
    }

    [HttpPost("block")]
    public async Task<ActionResult<ApiResponse<object?>>> BlockUser(
        [FromBody] BlockUserActionDto request,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.BlockUserAsync(request, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Block user failed.");
        }

        return NoContent();
    }

    [HttpDelete("block/{targetUserId}")]
    public async Task<ActionResult<ApiResponse<object?>>> UnblockUser(
        string targetUserId,
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.UnblockUserAsync(targetUserId, ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildErrorResponse<object?>(result, "Unblock user failed.");
        }

        return NoContent();
    }

    [HttpGet("blocked-users")]
    public async Task<ActionResult<ApiResponse<List<BlockedUserResponseDto>>>> GetBlockedUsers(
        CancellationToken cancellationToken)
    {
        var result = await _friendshipService.GetBlockedUsersAsync(ExtractAccessToken(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildErrorResponse<List<BlockedUserResponseDto>>(result, "Load blocked users failed.");
        }

        return StatusCode(ResolveSuccessStatusCode(result.StatusCode), ApiResponse<List<BlockedUserResponseDto>>.Ok(result.Data));
    }

}

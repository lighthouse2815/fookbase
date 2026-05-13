using InteractHub.Api.Application.DTOs.Common;
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
        var response = await _friendshipService.GetPendingRequestersAsync(cancellationToken);
        return Ok(ApiResponse<List<PendingFriendRequesterDto>>.Ok(response));
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetContacts(CancellationToken cancellationToken)
    {
        var response = await _friendshipService.GetContactsAsync(GetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<List<ContactDto>>.Ok(response));
    }

    [HttpGet("presence")]
    public async Task<ActionResult<ApiResponse<List<UserProfilePresenceDto>>>> GetFriendPresence(
        CancellationToken cancellationToken)
    {
        var response = await _friendshipService.GetFriendPresenceAsync(cancellationToken);
        return Ok(ApiResponse<List<UserProfilePresenceDto>>.Ok(response));
    }

    [HttpGet("suggestions")]
    public async Task<ActionResult<ApiResponse<List<FriendSuggestionResponseDto>>>> GetSuggestions(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await _friendshipService.GetSuggestionsAsync(page, pageSize, cancellationToken);
        return Ok(ApiResponse<List<FriendSuggestionResponseDto>>.Ok(response));
    }

    [HttpPost("request")]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> SendFriendRequest(
        [FromBody] SendFriendRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _friendshipService.SendFriendRequestAsync(request, cancellationToken);
        return Ok(ApiResponse<FriendshipResponseDto>.Ok(response));
    }

    [HttpPost("accept")]
    public async Task<ActionResult<ApiResponse<FriendshipResponseDto>>> AcceptFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var response = await _friendshipService.AcceptFriendRequestAsync(request, cancellationToken);
        return Ok(ApiResponse<FriendshipResponseDto>.Ok(response));
    }

    [HttpPost("reject")]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> RejectFriendRequest(
        [FromBody] FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        await _friendshipService.RejectFriendRequestAsync(request, cancellationToken);
        return NoContent();
    }

    [HttpPost("unfriend")]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> Unfriend(
        [FromBody] UnfriendActionDto request,
        CancellationToken cancellationToken)
    {
        await _friendshipService.UnfriendAsync(request, cancellationToken);
        return NoContent();
    }

    [HttpPost("block")]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> BlockUser(
        [FromBody] BlockUserActionDto request,
        CancellationToken cancellationToken)
    {
        await _friendshipService.BlockUserAsync(request, cancellationToken);
        return NoContent();
    }

    [HttpDelete("block/{targetUserId}")]
    public async Task<ActionResult<ApiResponse<NoContentDto>>> UnblockUser(
        string targetUserId,
        CancellationToken cancellationToken)
    {
        await _friendshipService.UnblockUserAsync(targetUserId, cancellationToken);
        return NoContent();
    }

    [HttpGet("blocked-users")]
    public async Task<ActionResult<ApiResponse<List<BlockedUserResponseDto>>>> GetBlockedUsers(
        CancellationToken cancellationToken)
    {
        var response = await _friendshipService.GetBlockedUsersAsync(GetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<List<BlockedUserResponseDto>>.Ok(response));
    }

}






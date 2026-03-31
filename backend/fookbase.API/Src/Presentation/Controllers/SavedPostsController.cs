using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/saved-posts")]
[Authorize]
public class SavedPostsController : ControllerBase
{
    private readonly ISavedPostService _savedPostService;

    public SavedPostsController(ISavedPostService savedPostService)
    {
        _savedPostService = savedPostService;
    }

    [HttpGet("my")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<PostResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var savedPosts = await _savedPostService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PostResponseDto>>.Ok(savedPosts));
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SavedPostStateResponseDto>>> SavePost(
        [FromBody] SavePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var state = await _savedPostService.SaveAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<SavedPostStateResponseDto>.Ok(state));
    }

    [HttpDelete("{postId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<SavedPostStateResponseDto>>> RemoveSavedPost(
        Guid postId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var state = await _savedPostService.RemoveAsync(userId, postId, cancellationToken);
        return Ok(ApiResponse<SavedPostStateResponseDto>.Ok(state));
    }
}

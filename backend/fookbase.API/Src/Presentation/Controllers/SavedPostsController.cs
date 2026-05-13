using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.SavedPosts;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/saved-posts")]
[Authorize]
public class SavedPostsController : ApiControllerBase
{
    private readonly ISavedPostService _savedPostService;

    public SavedPostsController(ISavedPostService savedPostService)
    {
        _savedPostService = savedPostService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<PostResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var savedPosts = await _savedPostService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PostResponseDto>>.Ok(savedPosts));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SavedPostStateResponseDto>>> SavePost(
        [FromBody] SavePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var state = await _savedPostService.SaveAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<SavedPostStateResponseDto>.Ok(state));
    }

    [HttpDelete("{postId:guid}")]
    public async Task<ActionResult<ApiResponse<SavedPostStateResponseDto>>> RemoveSavedPost(
        Guid postId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var state = await _savedPostService.RemoveAsync(userId, postId, cancellationToken);
        return Ok(ApiResponse<SavedPostStateResponseDto>.Ok(state));
    }
}




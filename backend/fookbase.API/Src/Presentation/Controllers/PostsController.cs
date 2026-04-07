using InteractHub.Api.Application.DTOs.Likes;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILikeService _likeService;

    public PostsController(IPostService postService, ILikeService likeService)
    {
        _postService = postService;
        _likeService = likeService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<PostResponseDto>>>> GetPosts(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var posts = await _postService.GetPagedAsync(query, TryGetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<PagedResult<PostResponseDto>>.Ok(posts));
    }

    [HttpGet("{postId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> GetPostById(
        Guid postId,
        CancellationToken cancellationToken)
    {
        var post = await _postService.GetByIdAsync(postId, TryGetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<PostResponseDto>.Ok(post));
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> CreatePost(
        [FromBody] CreatePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = Request.ExtractAccessToken();
        var created = await _postService.CreateAsync(GetCurrentUserId(), request, accessToken, cancellationToken);

        return CreatedAtAction(
            nameof(GetPostById),
            new { postId = created.Id },
            ApiResponse<PostResponseDto>.Ok(created));
    }

    [HttpPut("{postId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostResponseDto>>> UpdatePost(
        Guid postId,
        [FromBody] UpdatePostRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _postService.UpdateAsync(postId, GetCurrentUserId(), User.IsAdmin(), request, cancellationToken);
        return Ok(ApiResponse<PostResponseDto>.Ok(updated));
    }

    [HttpDelete("{postId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeletePost(
        Guid postId,
        CancellationToken cancellationToken)
    {
        await _postService.DeleteAsync(postId, GetCurrentUserId(), User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Post deleted." }));
    }

    [HttpPost("{postId:guid}/likes")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LikeStateResponseDto>>> LikePost(Guid postId, CancellationToken cancellationToken)
    {
        var state = await _likeService.LikeAsync(postId, GetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<LikeStateResponseDto>.Ok(state));
    }

    [HttpDelete("{postId:guid}/likes")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<LikeStateResponseDto>>> UnlikePost(Guid postId, CancellationToken cancellationToken)
    {
        var state = await _likeService.UnlikeAsync(postId, GetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<LikeStateResponseDto>.Ok(state));
    }

    [HttpPut("{postId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReactionStateResponseDto>>> SetReaction(
        Guid postId,
        [FromBody] SetPostReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var state = await _likeService.SetReactionAsync(postId, GetCurrentUserId(), request, cancellationToken);
        return Ok(ApiResponse<PostReactionStateResponseDto>.Ok(state));
    }

    [HttpDelete("{postId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReactionStateResponseDto>>> RemoveReaction(
        Guid postId,
        CancellationToken cancellationToken)
    {
        var state = await _likeService.RemoveReactionAsync(postId, GetCurrentUserId(), cancellationToken);
        return Ok(ApiResponse<PostReactionStateResponseDto>.Ok(state));
    }

    [HttpGet("{postId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReactionUsersResponseDto>>> GetReactionUsers(
        Guid postId,
        CancellationToken cancellationToken)
    {
        var users = await _likeService.GetReactionUsersAsync(postId, cancellationToken);
        return Ok(ApiResponse<PostReactionUsersResponseDto>.Ok(users));
    }

    private Guid GetCurrentUserId() => User.GetUserId();

    private Guid? TryGetCurrentUserId() => User.Identity?.IsAuthenticated == true ? User.GetUserId() : null;
}


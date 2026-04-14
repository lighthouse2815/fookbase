using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/comments")]
public class CommentsController : ApiControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ICommentReactionService _commentReactionService;

    public CommentsController(
        ICommentService commentService,
        ICommentReactionService commentReactionService)
    {
        _commentService = commentService;
        _commentReactionService = commentReactionService;
    }

    [HttpGet("post/{postId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<CommentResponseDto>>>> GetByPostId(
        Guid postId,
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        var comments = await _commentService.GetByPostIdAsync(postId, query, currentUserId, cancellationToken);
        return Ok(ApiResponse<PagedResult<CommentResponseDto>>.Ok(comments));
    }

    [HttpGet("{commentId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentResponseDto>>> GetById(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var currentUserId = TryGetCurrentUserId();
        var comment = await _commentService.GetByIdAsync(commentId, currentUserId, cancellationToken);
        return Ok(ApiResponse<CommentResponseDto>.Ok(comment));
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentResponseDto>>> Create(
        [FromBody] CreateCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var created = await _commentService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { commentId = created.Id },
            ApiResponse<CommentResponseDto>.Ok(created));
    }

    [HttpPut("{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentResponseDto>>> Update(
        Guid commentId,
        [FromBody] UpdateCommentRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var updated = await _commentService.UpdateAsync(commentId, userId, User.IsAdmin(), request, cancellationToken);
        return Ok(ApiResponse<CommentResponseDto>.Ok(updated));
    }

    [HttpDelete("{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid commentId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _commentService.DeleteAsync(commentId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Comment deleted." }));
    }

    [HttpPut("{commentId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentReactionStateResponseDto>>> SetReaction(
        Guid commentId,
        [FromBody] SetCommentReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var reactionState = await _commentReactionService.SetReactionAsync(commentId, userId, request, cancellationToken);
        return Ok(ApiResponse<CommentReactionStateResponseDto>.Ok(reactionState));
    }

    [HttpDelete("{commentId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentReactionStateResponseDto>>> RemoveReaction(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var reactionState = await _commentReactionService.RemoveReactionAsync(commentId, userId, cancellationToken);
        return Ok(ApiResponse<CommentReactionStateResponseDto>.Ok(reactionState));
    }

    [HttpGet("{commentId:guid}/reactions")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CommentReactionUsersResponseDto>>> GetReactionUsers(
        Guid commentId,
        CancellationToken cancellationToken)
    {
        var users = await _commentReactionService.GetReactionUsersAsync(commentId, cancellationToken);
        return Ok(ApiResponse<CommentReactionUsersResponseDto>.Ok(users));
    }
}

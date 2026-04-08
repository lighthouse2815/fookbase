using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/stories")]
[Authorize]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;
    private readonly IStoryReactionService _storyReactionService;

    public StoriesController(IStoryService storyService, IStoryReactionService storyReactionService)
    {
        _storyService = storyService;
        _storyReactionService = storyReactionService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetFeedStories(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var stories = await _storyService.GetFeedAsync(userId, query, Request.ExtractAccessToken(), cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryResponseDto>>.Ok(stories));
    }

    [HttpGet("user/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetStoriesByUser(
        Guid userId,
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        var stories = await _storyService.GetByUserIdAsync(userId, currentUserId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryResponseDto>>.Ok(stories));
    }

    [HttpGet("{storyId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> GetStoryById(
        Guid storyId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        var story = await _storyService.GetByIdAsync(storyId, currentUserId, cancellationToken);
        return Ok(ApiResponse<StoryResponseDto>.Ok(story));
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<StoryUploadResponseDto>>> UploadStoryMedia(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var uploaded = await _storyService.UploadMediaAsync(userId, file, cancellationToken);
        return Ok(ApiResponse<StoryUploadResponseDto>.Ok(uploaded));
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> CreateStory(
        [FromBody] CreateStoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var created = await _storyService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetStoryById),
            new { storyId = created.Id },
            ApiResponse<StoryResponseDto>.Ok(created));
    }

    [HttpPost("{storyId:guid}/view")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> MarkStoryAsViewed(Guid storyId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _storyService.MarkAsViewedAsync(storyId, userId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Story viewed." }));
    }

    [HttpDelete("{storyId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteStory(Guid storyId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _storyService.DeleteAsync(storyId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Story deleted." }));
    }

    [HttpPut("{storyId:guid}/reactions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StoryReactionStateResponseDto>>> SetReaction(
        Guid storyId,
        [FromBody] SetStoryReactionRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var state = await _storyReactionService.SetReactionAsync(storyId, userId, request, cancellationToken);
        return Ok(ApiResponse<StoryReactionStateResponseDto>.Ok(state));
    }

    [HttpDelete("{storyId:guid}/reactions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StoryReactionStateResponseDto>>> RemoveReaction(
        Guid storyId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var state = await _storyReactionService.RemoveReactionAsync(storyId, userId, cancellationToken);
        return Ok(ApiResponse<StoryReactionStateResponseDto>.Ok(state));
    }
}

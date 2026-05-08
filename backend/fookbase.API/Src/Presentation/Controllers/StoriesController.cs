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
public class StoriesController : ApiControllerBase
{
    private readonly IStoryService _storyService;
    private readonly IStoryReactionService _storyReactionService;

    public StoriesController(IStoryService storyService, IStoryReactionService storyReactionService)
    {
        _storyService = storyService;
        _storyReactionService = storyReactionService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetFeedStories(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var stories = await _storyService.GetFeedAsync(userId, query, ExtractAccessToken(), cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryResponseDto>>.Ok(stories));
    }

    [HttpGet("user/{userId:guid}")]
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
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> GetStoryById(
        Guid storyId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        var story = await _storyService.GetByIdAsync(storyId, currentUserId, cancellationToken);
        return Ok(ApiResponse<StoryResponseDto>.Ok(story));
    }

    [HttpPost]
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
    public async Task<ActionResult<ApiResponse<object>>> MarkStoryAsViewed(Guid storyId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _storyService.MarkAsViewedAsync(storyId, userId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Story viewed." }));
    }

    [HttpDelete("{storyId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteStory(Guid storyId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _storyService.DeleteAsync(storyId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Story deleted." }));
    }

    [HttpPut("{storyId:guid}/reactions")]
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
    public async Task<ActionResult<ApiResponse<StoryReactionStateResponseDto>>> RemoveReaction(
        Guid storyId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var state = await _storyReactionService.RemoveReactionAsync(storyId, userId, cancellationToken);
        return Ok(ApiResponse<StoryReactionStateResponseDto>.Ok(state));
    }
}

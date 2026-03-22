using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/stories")]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetActiveStories(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var stories = await _storyService.GetActiveAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryResponseDto>>.Ok(stories));
    }

    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetStoriesByUser(
        Guid userId,
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var stories = await _storyService.GetByUserIdAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryResponseDto>>.Ok(stories));
    }

    [HttpGet("{storyId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> GetStoryById(Guid storyId, CancellationToken cancellationToken)
    {
        var story = await _storyService.GetByIdAsync(storyId, cancellationToken);
        return Ok(ApiResponse<StoryResponseDto>.Ok(story));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
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

    [HttpPut("{storyId:guid}")]
    [Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<StoryResponseDto>>> UpdateStory(
        Guid storyId,
        [FromBody] UpdateStoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var updated = await _storyService.UpdateAsync(storyId, userId, User.IsAdmin(), request, cancellationToken);
        return Ok(ApiResponse<StoryResponseDto>.Ok(updated));
    }

    [HttpDelete("{storyId:guid}")]
    [Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
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
}
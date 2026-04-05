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
[Authorize]
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryResponseDto>>>> GetFeedStories(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var stories = await _storyService.GetFeedAsync(userId, query, ExtractAccessToken(), cancellationToken);
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

    private string? ExtractAccessToken()
    {
        var authorizationHeader = Request.Headers.Authorization.ToString();
        if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authorizationHeader["Bearer ".Length..].Trim();
        }

        if (Request.Cookies.TryGetValue(AuthCookieConstants.AccessTokenCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken;
        }

        return null;
    }
}

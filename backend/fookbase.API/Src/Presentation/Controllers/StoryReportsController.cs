using InteractHub.Api.Application.DTOs.StoryReports;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/story-reports")]
[Authorize]
public class StoryReportsController : ApiControllerBase
{
    private readonly IStoryReportService _storyReportService;

    public StoryReportsController(IStoryReportService storyReportService)
    {
        _storyReportService = storyReportService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryReportResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var reports = await _storyReportService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryReportResponseDto>>.Ok(reports));
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<PagedResult<StoryReportResponseDto>>>> GetAll(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var reports = await _storyReportService.GetAllAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StoryReportResponseDto>>.Ok(reports));
    }

    [HttpGet("pending-count")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<object>>> GetPendingCount(CancellationToken cancellationToken)
    {
        var pendingCount = await _storyReportService.GetPendingCountAsync(cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { pendingCount }));
    }

    [HttpGet("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<StoryReportResponseDto>>> GetById(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var report = await _storyReportService.GetByIdAsync(reportId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<StoryReportResponseDto>.Ok(report));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoryReportResponseDto>>> Create(
        [FromBody] CreateStoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var created = await _storyReportService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { reportId = created.Id },
            ApiResponse<StoryReportResponseDto>.Ok(created));
    }

    [HttpPatch("{reportId:guid}/resolve")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<StoryReportResponseDto>>> Resolve(
        Guid reportId,
        [FromBody] ResolveStoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var resolved = await _storyReportService.ResolveAsync(reportId, adminUserId, request, cancellationToken);

        return Ok(ApiResponse<StoryReportResponseDto>.Ok(resolved));
    }

    [HttpDelete("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _storyReportService.DeleteAsync(reportId, userId, User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Story report deleted." }));
    }
}


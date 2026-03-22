using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/post-reports")]
[Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
public class PostReportsController : ControllerBase
{
    private readonly IPostReportService _postReportService;

    public PostReportsController(IPostReportService postReportService)
    {
        _postReportService = postReportService;
    }

    [HttpGet("my")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<PostReportResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var reports = await _postReportService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PostReportResponseDto>>.Ok(reports));
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<PostReportResponseDto>>>> GetAll(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var reports = await _postReportService.GetAllAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<PostReportResponseDto>>.Ok(reports));
    }

    [HttpGet("{reportId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReportResponseDto>>> GetById(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var report = await _postReportService.GetByIdAsync(reportId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<PostReportResponseDto>.Ok(report));
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReportResponseDto>>> Create(
        [FromBody] CreatePostReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var created = await _postReportService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { reportId = created.Id },
            ApiResponse<PostReportResponseDto>.Ok(created));
    }

    [HttpPatch("{reportId:guid}/resolve")]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PostReportResponseDto>>> Resolve(
        Guid reportId,
        [FromBody] ResolvePostReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.GetUserId();
        var resolved = await _postReportService.ResolveAsync(reportId, adminUserId, request, cancellationToken);

        return Ok(ApiResponse<PostReportResponseDto>.Ok(resolved));
    }

    [HttpDelete("{reportId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _postReportService.DeleteAsync(reportId, userId, User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Post report deleted." }));
    }
}
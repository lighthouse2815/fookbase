using InteractHub.Api.Application.DTOs.CommentReports;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/comment-reports")]
[Authorize]
public class CommentReportsController : ApiControllerBase
{
    private readonly ICommentReportService _commentReportService;

    public CommentReportsController(ICommentReportService commentReportService)
    {
        _commentReportService = commentReportService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<CommentReportResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var reports = await _commentReportService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<CommentReportResponseDto>>.Ok(reports));
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<PagedResult<CommentReportResponseDto>>>> GetAll(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var reports = await _commentReportService.GetAllAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<CommentReportResponseDto>>.Ok(reports));
    }

    [HttpGet("pending-count")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<object>>> GetPendingCount(CancellationToken cancellationToken)
    {
        var pendingCount = await _commentReportService.GetPendingCountAsync(cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { pendingCount }));
    }

    [HttpGet("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<CommentReportResponseDto>>> GetById(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var report = await _commentReportService.GetByIdAsync(reportId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<CommentReportResponseDto>.Ok(report));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CommentReportResponseDto>>> Create(
        [FromBody] CreateCommentReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var created = await _commentReportService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { reportId = created.Id },
            ApiResponse<CommentReportResponseDto>.Ok(created));
    }

    [HttpPatch("{reportId:guid}/resolve")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<CommentReportResponseDto>>> Resolve(
        Guid reportId,
        [FromBody] ResolveCommentReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var resolved = await _commentReportService.ResolveAsync(reportId, adminUserId, request, cancellationToken);

        return Ok(ApiResponse<CommentReportResponseDto>.Ok(resolved));
    }

    [HttpDelete("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _commentReportService.DeleteAsync(reportId, userId, User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Comment report deleted." }));
    }
}




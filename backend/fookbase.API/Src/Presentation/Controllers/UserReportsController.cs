using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/user-reports")]
[Authorize]
public class UserReportsController : ApiControllerBase
{
    private readonly IUserReportService _userReportService;

    public UserReportsController(IUserReportService userReportService)
    {
        _userReportService = userReportService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserReportResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var reports = await _userReportService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<UserReportResponseDto>>.Ok(reports));
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<PagedResult<UserReportResponseDto>>>> GetAll(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var reports = await _userReportService.GetAllAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<UserReportResponseDto>>.Ok(reports));
    }

    [HttpGet("pending-count")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<object>>> GetPendingCount(CancellationToken cancellationToken)
    {
        var pendingCount = await _userReportService.GetPendingCountAsync(cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { pendingCount }));
    }

    [HttpGet("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<UserReportResponseDto>>> GetById(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var report = await _userReportService.GetByIdAsync(reportId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<UserReportResponseDto>.Ok(report));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserReportResponseDto>>> Create(
        [FromBody] CreateUserReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var created = await _userReportService.CreateAsync(userId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { reportId = created.Id },
            ApiResponse<UserReportResponseDto>.Ok(created));
    }

    [HttpPatch("{reportId:guid}/resolve")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<UserReportResponseDto>>> Resolve(
        Guid reportId,
        [FromBody] ResolveUserReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var resolved = await _userReportService.ResolveAsync(reportId, adminUserId, request, cancellationToken);

        return Ok(ApiResponse<UserReportResponseDto>.Ok(resolved));
    }

    [HttpDelete("{reportId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid reportId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _userReportService.DeleteAsync(reportId, userId, User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "User report deleted." }));
    }
}

using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = AppRoles.Admin)]
public class AdminController : ApiControllerBase
{
    private readonly IAdminConsoleService _adminConsoleService;
    private readonly IAdminAuditLogService _adminAuditLogService;

    public AdminController(
        IAdminConsoleService adminConsoleService,
        IAdminAuditLogService adminAuditLogService)
    {
        _adminConsoleService = adminConsoleService;
        _adminAuditLogService = adminAuditLogService;
    }

    [HttpGet("users/search")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminUserSearchResponseDto>>>> SearchUsers(
        [FromQuery] string? keyword,
        CancellationToken cancellationToken)
    {
        var users = await _adminConsoleService.SearchUsersAsync(keyword, ExtractAccessToken(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AdminUserSearchResponseDto>>.Ok(users));
    }

    [HttpPatch("users/{userId:guid}/status")]
    public async Task<ActionResult<ApiResponse<AdminUserSearchResponseDto>>> UpdateUserStatus(
        Guid userId,
        [FromBody] UpdateAdminUserStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var updated = await _adminConsoleService.UpdateUserStatusAsync(
            adminUserId,
            userId,
            request,
            ExtractAccessToken(),
            cancellationToken);

        return Ok(ApiResponse<AdminUserSearchResponseDto>.Ok(updated));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<AdminDashboardResponseDto>>> GetDashboard(CancellationToken cancellationToken)
    {
        var dashboard = await _adminConsoleService.GetDashboardAsync(ExtractAccessToken(), cancellationToken);
        return Ok(ApiResponse<AdminDashboardResponseDto>.Ok(dashboard));
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminAuditLogResponseDto>>>> GetAuditLogs(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var logs = await _adminAuditLogService.GetPagedAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<AdminAuditLogResponseDto>>.Ok(logs));
    }
}


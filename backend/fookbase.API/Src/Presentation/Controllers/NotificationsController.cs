using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notifications = await _notificationService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationResponseDto>>.Ok(notifications));
    }

    [HttpGet("{notificationId:guid}")]
    public async Task<ActionResult<ApiResponse<NotificationResponseDto>>> GetById(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notification = await _notificationService.GetByIdAsync(notificationId, userId, cancellationToken);
        return Ok(ApiResponse<NotificationResponseDto>.Ok(notification));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<NotificationResponseDto>>> Create(
        [FromBody] CreateNotificationRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _notificationService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { notificationId = created.Id },
            ApiResponse<NotificationResponseDto>.Ok(created));
    }

    [HttpPatch("{notificationId:guid}/read")]
    public async Task<ActionResult<ApiResponse<NotificationResponseDto>>> MarkAsRead(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var updated = await _notificationService.MarkAsReadAsync(notificationId, userId, cancellationToken);
        return Ok(ApiResponse<NotificationResponseDto>.Ok(updated));
    }

    [HttpPatch("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "All notifications are marked as read." }));
    }

    [HttpDelete("{notificationId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _notificationService.DeleteAsync(notificationId, userId, cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Notification deleted." }));
    }
}




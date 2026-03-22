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
[Authorize(Roles = AppRoles.User + "," + AppRoles.Admin)]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponseDto>>>> GetMine(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var notifications = await _notificationService.GetMineAsync(userId, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationResponseDto>>.Ok(notifications));
    }

    [HttpGet("{notificationId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<NotificationResponseDto>>> GetById(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var notification = await _notificationService.GetByIdAsync(notificationId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<NotificationResponseDto>.Ok(notification));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<NotificationResponseDto>>> MarkAsRead(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var updated = await _notificationService.MarkAsReadAsync(notificationId, userId, User.IsAdmin(), cancellationToken);
        return Ok(ApiResponse<NotificationResponseDto>.Ok(updated));
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "All notifications are marked as read." }));
    }

    [HttpDelete("{notificationId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        await _notificationService.DeleteAsync(notificationId, userId, User.IsAdmin(), cancellationToken);

        return Ok(ApiResponse<object>.Ok(new { message = "Notification deleted." }));
    }
}
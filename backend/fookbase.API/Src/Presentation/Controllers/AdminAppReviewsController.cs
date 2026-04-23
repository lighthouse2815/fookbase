using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/admin/app-reviews")]
[Authorize(Roles = AppRoles.Admin)]
public class AdminAppReviewsController : ApiControllerBase
{
    private readonly IAppReviewService _appReviewService;

    public AdminAppReviewsController(IAppReviewService appReviewService)
    {
        _appReviewService = appReviewService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<AppReviewResponseDto>>>> GetAll(
        [FromQuery] PaginationQuery query,
        [FromQuery] AdminAppReviewFilterRequestDto filter,
        CancellationToken cancellationToken)
    {
        var reviews = await _appReviewService.GetAdminAsync(
            query,
            filter.Rating,
            filter.IsHidden,
            cancellationToken);
        return Ok(ApiResponse<PagedResult<AppReviewResponseDto>>.Ok(reviews));
    }

    [HttpPatch("{reviewId:guid}/hide")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AppReviewResponseDto>>> Hide(Guid reviewId, CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var review = await _appReviewService.HideAsync(reviewId, adminUserId, cancellationToken);
        return Ok(ApiResponse<AppReviewResponseDto>.Ok(review));
    }

    [HttpPatch("{reviewId:guid}/unhide")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AppReviewResponseDto>>> Unhide(Guid reviewId, CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        var review = await _appReviewService.UnhideAsync(reviewId, adminUserId, cancellationToken);
        return Ok(ApiResponse<AppReviewResponseDto>.Ok(review));
    }

    [HttpDelete("{reviewId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid reviewId, CancellationToken cancellationToken)
    {
        var adminUserId = GetCurrentUserId();
        await _appReviewService.DeleteByAdminAsync(reviewId, adminUserId, cancellationToken);

        return Ok(ApiResponse<object>.Ok(new
        {
            message = "App review deleted."
        }));
    }
}

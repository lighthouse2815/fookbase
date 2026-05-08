using System.ComponentModel.DataAnnotations;
using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/app-reviews")]
public class AppReviewsController : ApiControllerBase
{
    private readonly IAppReviewService _appReviewService;

    public AppReviewsController(IAppReviewService appReviewService)
    {
        _appReviewService = appReviewService;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<PublicAppReviewResponseDto>>>> GetPublic(
        [FromQuery] PaginationQuery query,
        [FromQuery]
        [Range(1, 5)]
        int? rating,
        CancellationToken cancellationToken)
    {
        var reviews = await _appReviewService.GetPublicAsync(query, rating, cancellationToken);
        return Ok(ApiResponse<PagedResult<PublicAppReviewResponseDto>>.Ok(reviews));
    }

    [HttpGet("summary")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AppReviewSummaryResponseDto>>> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await _appReviewService.GetSummaryAsync(cancellationToken);
        return Ok(ApiResponse<AppReviewSummaryResponseDto>.Ok(summary));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<AppReviewResponseDto?>>> GetMyReview(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var review = await _appReviewService.GetMyReviewAsync(userId, cancellationToken);
        return Ok(ApiResponse<AppReviewResponseDto?>.Ok(review));
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<AppReviewResponseDto>>> CreateOrUpdate(
        [FromBody] CreateOrUpdateAppReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var review = await _appReviewService.CreateOrUpdateMyReviewAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<AppReviewResponseDto>.Ok(review));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<AppReviewResponseDto>>> UpdateMine(
        [FromBody] CreateOrUpdateAppReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var review = await _appReviewService.CreateOrUpdateMyReviewAsync(userId, request, cancellationToken);
        return Ok(ApiResponse<AppReviewResponseDto>.Ok(review));
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> DeleteMine(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _appReviewService.DeleteMyReviewAsync(userId, cancellationToken);

        return Ok(ApiResponse<object>.Ok(new
        {
            message = "App review deleted."
        }));
    }
}

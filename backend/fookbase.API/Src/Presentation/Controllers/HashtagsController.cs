using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Constants;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Common.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteractHub.Api.Controllers;

[ApiController]
[Route("api/hashtags")]
public class HashtagsController : ApiControllerBase
{
    private readonly IHashtagService _hashtagService;

    public HashtagsController(IHashtagService hashtagService)
    {
        _hashtagService = hashtagService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<HashtagResponseDto>>>> GetPaged(
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var hashtags = await _hashtagService.GetPagedAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<HashtagResponseDto>>.Ok(hashtags));
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PagedResult<HashtagResponseDto>>>> Search(
        [FromQuery] string keyword,
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken)
    {
        var hashtags = await _hashtagService.SearchAsync(keyword, query, cancellationToken);
        return Ok(ApiResponse<PagedResult<HashtagResponseDto>>.Ok(hashtags));
    }

    [HttpGet("{hashtagId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<HashtagResponseDto>>> GetById(Guid hashtagId, CancellationToken cancellationToken)
    {
        var hashtag = await _hashtagService.GetByIdAsync(hashtagId, cancellationToken);
        return Ok(ApiResponse<HashtagResponseDto>.Ok(hashtag));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<HashtagResponseDto>>> Create(
        [FromBody] CreateHashtagRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _hashtagService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { hashtagId = created.Id },
            ApiResponse<HashtagResponseDto>.Ok(created));
    }

    [HttpPut("{hashtagId:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<HashtagResponseDto>>> Update(
        Guid hashtagId,
        [FromBody] UpdateHashtagRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _hashtagService.UpdateAsync(hashtagId, request, cancellationToken);
        return Ok(ApiResponse<HashtagResponseDto>.Ok(updated));
    }

    [HttpDelete("{hashtagId:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid hashtagId, CancellationToken cancellationToken)
    {
        await _hashtagService.DeleteAsync(hashtagId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { message = "Hashtag deleted." }));
    }
}




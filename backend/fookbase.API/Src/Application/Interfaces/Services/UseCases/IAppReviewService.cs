using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Common.Pagination;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IAppReviewService
{
    Task<PagedResult<PublicAppReviewResponseDto>> GetPublicAsync(
        PaginationQuery query,
        int? rating,
        CancellationToken cancellationToken);

    Task<AppReviewSummaryResponseDto> GetSummaryAsync(CancellationToken cancellationToken);

    Task<AppReviewResponseDto?> GetMyReviewAsync(Guid userId, CancellationToken cancellationToken);

    Task<AppReviewResponseDto> CreateOrUpdateMyReviewAsync(
        Guid userId,
        CreateOrUpdateAppReviewRequestDto request,
        CancellationToken cancellationToken);

    Task DeleteMyReviewAsync(Guid userId, CancellationToken cancellationToken);

    Task<PagedResult<AppReviewResponseDto>> GetAdminAsync(
        PaginationQuery query,
        int? rating,
        bool? isHidden,
        CancellationToken cancellationToken);

    Task<AppReviewResponseDto> UpdateVisibilityAsync(
        Guid reviewId,
        Guid adminUserId,
        bool isHidden,
        CancellationToken cancellationToken);

    Task DeleteByAdminAsync(Guid reviewId, Guid adminUserId, CancellationToken cancellationToken);
}




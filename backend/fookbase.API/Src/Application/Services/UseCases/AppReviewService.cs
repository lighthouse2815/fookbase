using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Application.Validators;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class AppReviewService : IAppReviewService
{
    private readonly IAppReviewRepository _appReviewRepository;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AppReviewService> _logger;

    public AppReviewService(
        IAppReviewRepository appReviewRepository,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<AppReviewService> logger)
    {
        _appReviewRepository = appReviewRepository;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PublicAppReviewResponseDto>> GetPublicAsync(
        PaginationQuery query,
        int? rating,
        CancellationToken cancellationToken)
    {
        return await GetPagedAsync(
            query,
            rating,
            isHidden: false,
            static review => review.ToPublicResponseDto(),
            cancellationToken);
    }

    public async Task<AppReviewSummaryResponseDto> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var distribution = await _appReviewRepository.GetPublicRatingDistributionAsync(cancellationToken);
        var average = await _appReviewRepository.GetPublicAverageRatingAsync(cancellationToken);
        var totalCount = await _appReviewRepository.CountPublicAsync(cancellationToken);

        return AppReviewMapper.ToSummaryResponseDto(distribution, average, totalCount);
    }

    public async Task<AppReviewResponseDto?> GetMyReviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByUserIdAsync(userId, cancellationToken);
        return review?.ToResponseDto();
    }

    public async Task<AppReviewResponseDto> CreateOrUpdateMyReviewAsync(
        Guid userId,
        CreateOrUpdateAppReviewRequestDto request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var rating = AppReviewValidator.ValidateRating(request.Rating);
        var displayName = AppReviewValidator.NormalizeDisplayName(request.DisplayName);
        var comment = AppReviewValidator.NormalizeComment(request.Comment);

        var now = DateTime.UtcNow;
        var existing = await _appReviewRepository.GetByUserIdForUpdateAsync(userId, cancellationToken);

        if (existing is null)
        {
            var newReview = new AppReview
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DisplayName = displayName,
                Rating = rating,
                Comment = comment,
                IsHidden = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _appReviewRepository.AddAsync(newReview, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return newReview.ToResponseDto();
        }

        existing.Rating = rating;
        existing.DisplayName = displayName;
        existing.Comment = comment;
        existing.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return existing.ToResponseDto();
    }

    public async Task DeleteMyReviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByUserIdForUpdateAsync(userId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.APP_REVIEW_NOT_FOUND);

        _appReviewRepository.Remove(review);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<AppReviewResponseDto>> GetAdminAsync(
        PaginationQuery query,
        int? rating,
        bool? isHidden,
        CancellationToken cancellationToken)
    {
        return await GetPagedAsync(
            query,
            rating,
            isHidden,
            static review => review.ToResponseDto(),
            cancellationToken);
    }

    public async Task<AppReviewResponseDto> UpdateVisibilityAsync(
        Guid reviewId,
        Guid adminUserId,
        bool isHidden,
        CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByIdForUpdateAsync(reviewId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.APP_REVIEW_NOT_FOUND);

        review.IsHidden = isHidden;
        review.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            isHidden ? AdminAuditActionType.APP_REVIEW_HIDDEN : AdminAuditActionType.APP_REVIEW_UNHIDDEN,
            AdminAuditEntityType.APP_REVIEW,
            review.Id,
            review.UserId,
            $"AppReviewId={review.Id};UserId={review.UserId};IsHidden={isHidden};Rating={review.Rating}.",
            cancellationToken);

        return review.ToResponseDto();
    }

    public async Task DeleteByAdminAsync(Guid reviewId, Guid adminUserId, CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByIdForUpdateAsync(reviewId, cancellationToken)
            ?? throw new BusinessException(ErrorCode.APP_REVIEW_NOT_FOUND);

        _appReviewRepository.Remove(review);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _adminAuditLogService.CreateAdminAuditLogAsync(
            adminUserId,
            AdminAuditActionType.APP_REVIEW_DELETED,
            AdminAuditEntityType.APP_REVIEW,
            review.Id,
            review.UserId,
            $"AppReviewId={review.Id};UserId={review.UserId};Rating={review.Rating}.",
            cancellationToken);
    }

    private async Task<PagedResult<TResponse>> GetPagedAsync<TResponse>(
        PaginationQuery query,
        int? rating,
        bool? isHidden,
        Func<AppReview, TResponse> map,
        CancellationToken cancellationToken)
    {
        query.Normalize();
        AppReviewValidator.ValidateOptionalRating(rating);

        var (items, totalCount) = await _appReviewRepository.GetPagedAsync(
            query.Page,
            query.PageSize,
            rating,
            isHidden,
            cancellationToken);

        var mappedItems = items
            .Select(map)
            .ToList();

        return PagedResult<TResponse>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

}




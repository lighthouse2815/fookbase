using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class AppReviewService : IAppReviewService
{
    private const int MinRating = 1;
    private const int MaxRating = 5;
    private const int MinDisplayNameLength = 2;
    private const int MaxDisplayNameLength = 80;
    private const int MinCommentLength = 3;
    private const int MaxCommentLength = 1000;

    private readonly IAppReviewRepository _appReviewRepository;
    private readonly IJavaApiService _javaApiService;
    private readonly IAdminAuditLogService _adminAuditLogService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AppReviewService> _logger;

    public AppReviewService(
        IAppReviewRepository appReviewRepository,
        IJavaApiService javaApiService,
        IAdminAuditLogService adminAuditLogService,
        IUnitOfWork unitOfWork,
        ILogger<AppReviewService> logger)
    {
        _appReviewRepository = appReviewRepository;
        _javaApiService = javaApiService;
        _adminAuditLogService = adminAuditLogService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PublicAppReviewResponseDto>> GetPublicAsync(
        PaginationQuery query,
        int? rating,
        CancellationToken cancellationToken)
    {
        query.Normalize();
        ValidateOptionalRating(rating);

        var (items, totalCount) = await _appReviewRepository.GetPublicPagedAsync(
            query.Page,
            query.PageSize,
            rating,
            cancellationToken);

        var mappedItems = items
            .Select(review => review.ToPublicResponseDto())
            .ToList();

        return PagedResult<PublicAppReviewResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public async Task<AppReviewSummaryResponseDto> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var distribution = await _appReviewRepository.GetPublicRatingDistributionAsync(cancellationToken);
        var average = await _appReviewRepository.GetPublicAverageRatingAsync(cancellationToken);
        var totalCount = await _appReviewRepository.CountPublicAsync(cancellationToken);

        return new AppReviewSummaryResponseDto
        {
            AverageRating = Math.Round(average, 1, MidpointRounding.AwayFromZero),
            TotalReviews = totalCount,
            FiveStarCount = distribution.TryGetValue(5, out var fiveStarCount) ? fiveStarCount : 0,
            FourStarCount = distribution.TryGetValue(4, out var fourStarCount) ? fourStarCount : 0,
            ThreeStarCount = distribution.TryGetValue(3, out var threeStarCount) ? threeStarCount : 0,
            TwoStarCount = distribution.TryGetValue(2, out var twoStarCount) ? twoStarCount : 0,
            OneStarCount = distribution.TryGetValue(1, out var oneStarCount) ? oneStarCount : 0
        };
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
        await EnsureUserExistsAsync(userId, cancellationToken);

        var rating = ValidateRating(request.Rating);
        var displayName = NormalizeDisplayName(request.DisplayName);
        var comment = NormalizeComment(request.Comment);

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
            ?? throw new NotFoundException("App review not found.");

        _appReviewRepository.Remove(review);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<AppReviewResponseDto>> GetAdminAsync(
        PaginationQuery query,
        int? rating,
        bool? isHidden,
        CancellationToken cancellationToken)
    {
        query.Normalize();
        ValidateOptionalRating(rating);

        var (items, totalCount) = await _appReviewRepository.GetAdminPagedAsync(
            query.Page,
            query.PageSize,
            rating,
            isHidden,
            cancellationToken);

        var mappedItems = items
            .Select(review => review.ToResponseDto())
            .ToList();

        return PagedResult<AppReviewResponseDto>.Create(mappedItems, query.Page, query.PageSize, totalCount);
    }

    public Task<AppReviewResponseDto> HideAsync(Guid reviewId, Guid adminUserId, CancellationToken cancellationToken)
    {
        return SetHiddenStateAsync(reviewId, adminUserId, true, cancellationToken);
    }

    public Task<AppReviewResponseDto> UnhideAsync(Guid reviewId, Guid adminUserId, CancellationToken cancellationToken)
    {
        return SetHiddenStateAsync(reviewId, adminUserId, false, cancellationToken);
    }

    public async Task DeleteByAdminAsync(Guid reviewId, Guid adminUserId, CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByIdForUpdateAsync(reviewId, cancellationToken)
            ?? throw new NotFoundException("App review not found.");

        _appReviewRepository.Remove(review);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                "APP_REVIEW_DELETED",
                "APP_REVIEW",
                review.Id,
                review.UserId,
                $"AppReviewId={review.Id};UserId={review.UserId};Rating={review.Rating}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist audit log for app review deletion. ReviewId={ReviewId}", review.Id);
        }
    }

    private async Task<AppReviewResponseDto> SetHiddenStateAsync(
        Guid reviewId,
        Guid adminUserId,
        bool isHidden,
        CancellationToken cancellationToken)
    {
        var review = await _appReviewRepository.GetByIdForUpdateAsync(reviewId, cancellationToken)
            ?? throw new NotFoundException("App review not found.");

        review.IsHidden = isHidden;
        review.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            await _adminAuditLogService.LogAsync(
                adminUserId,
                isHidden ? "APP_REVIEW_HIDDEN" : "APP_REVIEW_UNHIDDEN",
                "APP_REVIEW",
                review.Id,
                review.UserId,
                $"AppReviewId={review.Id};UserId={review.UserId};IsHidden={isHidden};Rating={review.Rating}.",
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not persist audit log for app review visibility update. ReviewId={ReviewId}, IsHidden={IsHidden}",
                review.Id,
                isHidden);
        }

        return review.ToResponseDto();
    }

    private async Task EnsureUserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _javaApiService.GetUserById(userId, cancellationToken);
        if (user is null)
        {
            throw new NotFoundException("User not found.");
        }
    }

    private static void ValidateOptionalRating(int? rating)
    {
        if (!rating.HasValue)
        {
            return;
        }

        ValidateRating(rating.Value);
    }

    private static int ValidateRating(int rating)
    {
        if (rating < MinRating || rating > MaxRating)
        {
            throw new ArgumentException("Rating must be between 1 and 5.");
        }

        return rating;
    }

    private static string NormalizeDisplayName(string? displayName)
    {
        var normalized = displayName.TrimToNull()
            ?? throw new ArgumentException("Display name is required.");

        if (normalized.Length < MinDisplayNameLength || normalized.Length > MaxDisplayNameLength)
        {
            throw new ArgumentException("Display name length must be between 2 and 80 characters.");
        }

        return normalized;
    }

    private static string NormalizeComment(string? comment)
    {
        var normalized = comment.TrimToNull()
            ?? throw new ArgumentException("Comment is required.");

        if (normalized.Length < MinCommentLength || normalized.Length > MaxCommentLength)
        {
            throw new ArgumentException("Comment length must be between 3 and 1000 characters.");
        }

        return normalized;
    }
}

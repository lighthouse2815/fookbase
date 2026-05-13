using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class AppReviewServiceTests
{
    private readonly Mock<IAppReviewRepository> _appReviewRepositoryMock = new();
    private readonly Mock<IAdminAuditLogService> _adminAuditLogServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<AppReviewService>> _loggerMock = new();

    private AppReviewService CreateService()
    {
        return new AppReviewService(
            _appReviewRepositoryMock.Object,
            _adminAuditLogServiceMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateOrUpdateMyReviewAsync_CreatesReview_WhenUserHasNoReview()
    {
        var userId = Guid.NewGuid();
        var service = CreateService();

        _appReviewRepositoryMock
            .Setup(repository => repository.GetByUserIdForUpdateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.AppReview?)null);

        Domain.Entities.AppReview? createdEntity = null;
        _appReviewRepositoryMock
            .Setup(repository => repository.AddAsync(It.IsAny<Domain.Entities.AppReview>(), It.IsAny<CancellationToken>()))
            .Callback<Domain.Entities.AppReview, CancellationToken>((entity, _) => createdEntity = entity)
            .Returns(Task.CompletedTask);

        var request = new CreateOrUpdateAppReviewRequestDto
        {
            Rating = 5,
            DisplayName = "  Alice  ",
            Comment = "  Great app!  "
        };

        var result = await service.CreateOrUpdateMyReviewAsync(userId, request, CancellationToken.None);

        Assert.NotNull(createdEntity);
        Assert.Equal(userId, createdEntity!.UserId);
        Assert.Equal(5, createdEntity.Rating);
        Assert.Equal("Alice", createdEntity.DisplayName);
        Assert.Equal("Great app!", createdEntity.Comment);
        Assert.False(createdEntity.IsHidden);
        Assert.Equal(createdEntity.Id, result.Id);

        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrUpdateMyReviewAsync_ThrowsArgumentException_WhenRatingIsInvalid()
    {
        var userId = Guid.NewGuid();
        var service = CreateService();

        var request = new CreateOrUpdateAppReviewRequestDto
        {
            Rating = 6,
            DisplayName = "Alice",
            Comment = "Great"
        };

        var exception = await Assert.ThrowsAsync<BusinessException>(
            () => service.CreateOrUpdateMyReviewAsync(userId, request, CancellationToken.None));

        Assert.Equal(ErrorCode.APP_REVIEW_RATING_INVALID, exception.ErrorCode);
    }

    [Fact]
    public async Task DeleteMyReviewAsync_RemovesOwnReview()
    {
        var userId = Guid.NewGuid();
        var review = new Domain.Entities.AppReview
        {
            Id = Guid.NewGuid(),
            UserId = userId
        };

        var service = CreateService();

        _appReviewRepositoryMock
            .Setup(repository => repository.GetByUserIdForUpdateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(review);

        await service.DeleteMyReviewAsync(userId, CancellationToken.None);

        _appReviewRepositoryMock.Verify(repository => repository.Remove(review), Times.Once);
        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVisibilityAsync_UpdatesVisibility()
    {
        var review = new Domain.Entities.AppReview
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            DisplayName = "Alice",
            Rating = 3,
            Comment = "Good",
            IsHidden = false,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var adminUserId = Guid.NewGuid();
        var service = CreateService();

        _appReviewRepositoryMock
            .Setup(repository => repository.GetByIdForUpdateAsync(review.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(review);

        var hidden = await service.UpdateVisibilityAsync(review.Id, adminUserId, true, CancellationToken.None);
        Assert.True(review.IsHidden);
        Assert.True(hidden.IsHidden);

        var unhidden = await service.UpdateVisibilityAsync(review.Id, adminUserId, false, CancellationToken.None);
        Assert.False(review.IsHidden);
        Assert.False(unhidden.IsHidden);

        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _adminAuditLogServiceMock.Verify(
            audit => audit.CreateAdminAuditLogAsync(
                adminUserId,
                It.IsAny<Domain.Enums.AdminAuditActionType>(),
                Domain.Enums.AdminAuditEntityType.APP_REVIEW,
                review.Id,
                review.UserId,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }
}

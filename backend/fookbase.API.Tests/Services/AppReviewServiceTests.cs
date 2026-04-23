using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class AppReviewServiceTests
{
    private readonly Mock<IAppReviewRepository> _appReviewRepositoryMock = new();
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<IAdminAuditLogService> _adminAuditLogServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<AppReviewService>> _loggerMock = new();

    private AppReviewService CreateService()
    {
        return new AppReviewService(
            _appReviewRepositoryMock.Object,
            _javaApiServiceMock.Object,
            _adminAuditLogServiceMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateOrUpdateMyReviewAsync_CreatesReview_WhenUserHasNoReview()
    {
        var userId = Guid.NewGuid();
        var service = CreateService();

        _javaApiServiceMock
            .Setup(service => service.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });

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
        Assert.Equal("Alice", result.DisplayName);
        Assert.Equal("Great app!", result.Comment);

        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrUpdateMyReviewAsync_UpdatesReview_WhenReviewAlreadyExists()
    {
        var userId = Guid.NewGuid();
        var review = new Domain.Entities.AppReview
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DisplayName = "Old Name",
            Rating = 2,
            Comment = "Old comment",
            IsHidden = true,
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var service = CreateService();

        _javaApiServiceMock
            .Setup(javaApi => javaApi.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });

        _appReviewRepositoryMock
            .Setup(repository => repository.GetByUserIdForUpdateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(review);

        var request = new CreateOrUpdateAppReviewRequestDto
        {
            Rating = 4,
            DisplayName = "  New Name ",
            Comment = " Updated comment "
        };

        var result = await service.CreateOrUpdateMyReviewAsync(userId, request, CancellationToken.None);

        Assert.Equal(4, review.Rating);
        Assert.Equal("New Name", review.DisplayName);
        Assert.Equal("Updated comment", review.Comment);
        Assert.True(review.IsHidden);
        Assert.Equal(review.Id, result.Id);
        Assert.Equal("New Name", result.DisplayName);
        Assert.Equal("Updated comment", result.Comment);

        _appReviewRepositoryMock.Verify(
            repository => repository.AddAsync(It.IsAny<Domain.Entities.AppReview>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateOrUpdateMyReviewAsync_ThrowsArgumentException_WhenRatingIsInvalid()
    {
        var userId = Guid.NewGuid();
        var service = CreateService();

        _javaApiServiceMock
            .Setup(javaApi => javaApi.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });

        var request = new CreateOrUpdateAppReviewRequestDto
        {
            Rating = 6,
            DisplayName = "Alice",
            Comment = "Great"
        };

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateOrUpdateMyReviewAsync(userId, request, CancellationToken.None));
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
    public async Task DeleteMyReviewAsync_ThrowsNotFound_WhenReviewDoesNotExist()
    {
        var userId = Guid.NewGuid();
        var service = CreateService();

        _appReviewRepositoryMock
            .Setup(repository => repository.GetByUserIdForUpdateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.AppReview?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => service.DeleteMyReviewAsync(userId, CancellationToken.None));
    }

    [Fact]
    public async Task HideAndUnhideAsync_UpdatesVisibility()
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

        var hidden = await service.HideAsync(review.Id, adminUserId, CancellationToken.None);
        Assert.True(review.IsHidden);
        Assert.True(hidden.IsHidden);

        var unhidden = await service.UnhideAsync(review.Id, adminUserId, CancellationToken.None);
        Assert.False(review.IsHidden);
        Assert.False(unhidden.IsHidden);

        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsAggregatedStats()
    {
        var service = CreateService();

        _appReviewRepositoryMock
            .Setup(repository => repository.GetPublicRatingDistributionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, int>
            {
                [5] = 6,
                [4] = 3,
                [2] = 1
            });

        _appReviewRepositoryMock
            .Setup(repository => repository.GetPublicAverageRatingAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(4.63d);

        _appReviewRepositoryMock
            .Setup(repository => repository.CountPublicAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(10);

        var summary = await service.GetSummaryAsync(CancellationToken.None);

        Assert.Equal(4.6d, summary.AverageRating);
        Assert.Equal(10, summary.TotalReviews);
        Assert.Equal(6, summary.FiveStarCount);
        Assert.Equal(3, summary.FourStarCount);
        Assert.Equal(0, summary.ThreeStarCount);
        Assert.Equal(1, summary.TwoStarCount);
        Assert.Equal(0, summary.OneStarCount);
    }
}

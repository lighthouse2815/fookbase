using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Pagination;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _notificationRepositoryMock = new();
    private readonly Mock<INotificationRealtimeService> _notificationRealtimeServiceMock = new();
    private readonly Mock<IUserIdentityReadModelService> _userIdentityReadModelServiceMock = new();
    private readonly Mock<IUserProfileSummaryReadModelService> _userProfileSummaryReadModelServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<ILogger<NotificationService>> _loggerMock = new();

    private NotificationService CreateService()
    {
        _userProfileSummaryReadModelServiceMock
            .Setup(service => service.GetProfileSummariesAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>(),
                It.IsAny<string?>()))
            .ReturnsAsync((IEnumerable<Guid> userIds, CancellationToken _, bool _, string? _) =>
            {
                var result = new Dictionary<Guid, UserProfileSummaryDto?>();
                foreach (var userId in userIds.Distinct())
                {
                    result[userId] = new UserProfileSummaryDto
                    {
                        UserId = userId,
                        DisplayName = $"user-{userId}",
                        AvatarUrl = null
                    };
                }

                return result;
            });

        return new NotificationService(
            _notificationRepositoryMock.Object,
            _notificationRealtimeServiceMock.Object,
            _userIdentityReadModelServiceMock.Object,
            _userProfileSummaryReadModelServiceMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetMineAsync_NormalizesPagination_AndReturnsMappedItems()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActorUserId = Guid.NewGuid(),
                Type = NotificationType.LIKE,
                Message = "Someone liked your post.",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsRead = false
            }
        };

        _notificationRepositoryMock
            .Setup(repository => repository.GetPagedByUserIdAsync(userId, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync((notifications, notifications.Count));

        var service = CreateService();
        var query = new PaginationQuery { Page = 0, PageSize = 0 };

        var result = await service.GetMineAsync(userId, query, CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(notifications[0].Id, result.Items[0].Id);
    }

    [Fact]
    public async Task GetByIdAsync_ThrowsForbidden_WhenCallerIsNotOwner()
    {
        var notificationId = Guid.NewGuid();
        _notificationRepositoryMock
            .Setup(repository => repository.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Notification
            {
                Id = notificationId,
                UserId = Guid.NewGuid(),
                ActorUserId = Guid.NewGuid(),
                Type = NotificationType.LIKE,
                Message = "x",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GetByIdAsync(notificationId, Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(ErrorCode.FORBIDDEN, exception.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_PersistsNotification_AndBroadcastsRealtimeEvent()
    {
        var targetUserId = Guid.NewGuid();
        var actorUserId = Guid.NewGuid();
        var request = new CreateNotificationRequestDto
        {
            UserId = targetUserId,
            ActorUserId = actorUserId,
            Type = " like ",
            Message = " your post got a reaction "
        };

        _userIdentityReadModelServiceMock
            .Setup(service => service.ExistsAsync(targetUserId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(true);
        _userIdentityReadModelServiceMock
            .Setup(service => service.ExistsAsync(actorUserId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(true);

        _notificationRepositoryMock
            .Setup(repository => repository.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _notificationRealtimeServiceMock
            .Setup(service => service.NotifyCreatedAsync(It.IsAny<NotificationResponseDto>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateService();
        var result = await service.CreateAsync(request, CancellationToken.None);

        Assert.Equal(targetUserId, result.UserId);
        Assert.Equal(actorUserId, result.ActorUserId);
        Assert.Equal(NotificationType.LIKE, result.Type);
        Assert.Equal("your post got a reaction", result.Message);

        _notificationRealtimeServiceMock.Verify(
            realtime => realtime.NotifyCreatedAsync(
                It.Is<NotificationResponseDto>(notification => notification.UserId == targetUserId && notification.Type == NotificationType.LIKE),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_ThrowsForbidden_WhenCallerIsNotOwner()
    {
        _notificationRepositoryMock
            .Setup(repository => repository.GetByIdForUpdateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                ActorUserId = Guid.NewGuid(),
                Type = NotificationType.LIKE,
                Message = "x",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(() =>
            service.MarkAsReadAsync(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(ErrorCode.FORBIDDEN, exception.ErrorCode);
    }
}

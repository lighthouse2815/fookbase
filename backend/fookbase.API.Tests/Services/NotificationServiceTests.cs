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
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<INotificationRealtimeService> _notificationRealtimeServiceMock = new();
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
                userIds
                    .Distinct()
                    .ToDictionary(userId => userId, _ => (UserProfileSummaryDto?)null));

        return new NotificationService(
            _notificationRepositoryMock.Object,
            _javaApiServiceMock.Object,
            _notificationRealtimeServiceMock.Object,
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
    public async Task GetByIdAsync_ThrowsNotFound_WhenNotificationDoesNotExist()
    {
        _notificationRepositoryMock
            .Setup(repository => repository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification?)null);

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(() =>
            service.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid(), isAdmin: false, CancellationToken.None));

        Assert.Equal(ErrorCode.NOTIFICATION_NOT_FOUND, exception.ErrorCode);
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

        _javaApiServiceMock
            .Setup(service => service.GetUserById(targetUserId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new InteractHub.Api.Application.DTOs.JavaApi.UserDto { Id = targetUserId });
        _javaApiServiceMock
            .Setup(service => service.GetUserById(actorUserId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new InteractHub.Api.Application.DTOs.JavaApi.UserDto { Id = actorUserId });

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
        Assert.Equal("LIKE", result.Type);
        Assert.Equal("your post got a reaction", result.Message);

        _notificationRealtimeServiceMock.Verify(
            realtime => realtime.NotifyCreatedAsync(
                It.Is<NotificationResponseDto>(notification => notification.UserId == targetUserId && notification.Type == "LIKE"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenNotificationTypeIsInvalid()
    {
        var request = new CreateNotificationRequestDto
        {
            UserId = Guid.NewGuid(),
            ActorUserId = Guid.NewGuid(),
            Type = "not_a_supported_type",
            Message = "x"
        };

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(() => service.CreateAsync(request, CancellationToken.None));

        Assert.Equal(ErrorCode.INVALID_NOTIFICATION_TYPE, exception.ErrorCode);
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
            service.MarkAsReadAsync(Guid.NewGuid(), Guid.NewGuid(), isAdmin: false, CancellationToken.None));

        Assert.Equal(ErrorCode.FORBIDDEN, exception.ErrorCode);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_UpdatesUnreadNotifications_AndBroadcastsRealtimeEvent()
    {
        var userId = Guid.NewGuid();
        var unreadNotifications = new List<Notification>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActorUserId = Guid.NewGuid(),
                Type = NotificationType.COMMENT,
                Message = "A",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActorUserId = Guid.NewGuid(),
                Type = NotificationType.LIKE,
                Message = "B",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _notificationRepositoryMock
            .Setup(repository => repository.GetUnreadByUserIdForUpdateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(unreadNotifications);

        _unitOfWorkMock
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _notificationRealtimeServiceMock
            .Setup(service => service.NotifyMarkedAllReadAsync(userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateService();
        await service.MarkAllAsReadAsync(userId, CancellationToken.None);

        Assert.All(unreadNotifications, notification => Assert.True(notification.IsRead));
        _notificationRealtimeServiceMock.Verify(
            realtime => realtime.NotifyMarkedAllReadAsync(userId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_RemovesNotification_AndBroadcastsRealtimeEvent()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            ActorUserId = Guid.NewGuid(),
            Type = NotificationType.LIKE,
            Message = "x",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _notificationRepositoryMock
            .Setup(repository => repository.GetByIdForUpdateAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notification);

        _unitOfWorkMock
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _notificationRealtimeServiceMock
            .Setup(service => service.NotifyDeletedAsync(userId, notificationId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var service = CreateService();
        await service.DeleteAsync(notificationId, userId, isAdmin: false, CancellationToken.None);

        _notificationRepositoryMock.Verify(repository => repository.Remove(notification), Times.Once);
        _notificationRealtimeServiceMock.Verify(
            realtime => realtime.NotifyDeletedAsync(userId, notificationId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

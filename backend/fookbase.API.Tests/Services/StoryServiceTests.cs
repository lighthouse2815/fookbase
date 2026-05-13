using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class StoryServiceTests
{
    private readonly Mock<IAccessTokenProvider> _accessTokenProviderMock = new();
    private readonly Mock<IStoryRepository> _storyRepositoryMock = new();
    private readonly Mock<IStoryReactionRepository> _storyReactionRepositoryMock = new();
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<IUserReadModelService> _userReadModelServiceMock = new();
    private readonly Mock<IUserProfileSummaryReadModelService> _userProfileSummaryReadModelServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly Mock<ILogger<StoryService>> _loggerMock = new();

    private StoryService CreateService()
    {
        _userReadModelServiceMock
            .Setup(service => service.ResolveBlockedUserIdsAsync(
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new HashSet<Guid>());

        _userReadModelServiceMock
            .Setup(service => service.ResolveContactIdsAsync(
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync(new HashSet<Guid>());

        _userProfileSummaryReadModelServiceMock
            .Setup(service => service.GetProfileSummariesAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new Dictionary<Guid, UserProfileSummaryDto?>());

        return new StoryService(
            _accessTokenProviderMock.Object,
            _storyRepositoryMock.Object,
            _storyReactionRepositoryMock.Object,
            _javaApiServiceMock.Object,
            _userReadModelServiceMock.Object,
            _userProfileSummaryReadModelServiceMock.Object,
            _unitOfWorkMock.Object,
            _httpContextAccessorMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenMediaTypeIsInvalid()
    {
        var userId = Guid.NewGuid();
        _javaApiServiceMock
            .Setup(service => service.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });

        var service = CreateService();
        var request = new CreateStoryRequestDto
        {
            MediaUrl = "https://cdn.example.com/story.jpg",
            MediaType = "document",
            Content = "hello"
        };

        var exception = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateAsync(userId, request, CancellationToken.None));

        Assert.Equal(ErrorCode.INVALID_STORY_MEDIA_TYPE, exception.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_AddsStory_AndSavesChanges()
    {
        var userId = Guid.NewGuid();
        Story? addedStory = null;

        _javaApiServiceMock
            .Setup(service => service.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });
        _userProfileSummaryReadModelServiceMock
            .Setup(service => service.GetProfileSummariesAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new Dictionary<Guid, UserProfileSummaryDto?>
            {
                [userId] = new()
                {
                    UserId = userId,
                    DisplayName = "Story Owner",
                    AvatarUrl = "https://cdn.example.com/avatar.jpg"
                }
            });

        _storyRepositoryMock
            .Setup(repository => repository.AddAsync(It.IsAny<Story>(), It.IsAny<CancellationToken>()))
            .Callback<Story, CancellationToken>((story, _) => addedStory = story)
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var service = CreateService();
        var request = new CreateStoryRequestDto
        {
            MediaUrl = "https://cdn.example.com/story.jpg",
            MediaType = "image",
            Content = "Hello world"
        };

        var result = await service.CreateAsync(userId, request, CancellationToken.None);

        Assert.NotNull(addedStory);
        Assert.Equal(userId, addedStory!.UserId);
        Assert.Equal(MediaType.IMAGE, addedStory.MediaType);
        Assert.Equal("https://cdn.example.com/story.jpg", addedStory.MediaUrl);

        Assert.Equal("Story Owner", result.Author.DisplayName);
        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkAsViewedAsync_DoesNothing_WhenViewerIsStoryOwner()
    {
        var storyId = Guid.NewGuid();
        var viewerId = Guid.NewGuid();

        _storyRepositoryMock
            .Setup(repository => repository.GetByIdForUpdateAsync(storyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Story
            {
                Id = storyId,
                UserId = viewerId,
                MediaUrl = "https://cdn.example.com/story.jpg",
                MediaType = MediaType.IMAGE,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                ExpiredAt = DateTime.UtcNow.AddHours(1),
                IsDeleted = false
            });

        var service = CreateService();
        await service.MarkAsViewedAsync(storyId, viewerId, CancellationToken.None);

        _storyRepositoryMock.Verify(repository => repository.HasViewAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _storyRepositoryMock.Verify(repository => repository.AddViewAsync(It.IsAny<StoryView>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MarkAsViewedAsync_AddsView_AndPersists_WhenFirstTimeViewer()
    {
        var storyId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var viewerId = Guid.NewGuid();

        _storyRepositoryMock
            .Setup(repository => repository.GetByIdForUpdateAsync(storyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Story
            {
                Id = storyId,
                UserId = ownerId,
                MediaUrl = "https://cdn.example.com/story.jpg",
                MediaType = MediaType.IMAGE,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                ExpiredAt = DateTime.UtcNow.AddHours(1),
                IsDeleted = false
            });

        _storyRepositoryMock
            .Setup(repository => repository.HasViewAsync(storyId, viewerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _storyRepositoryMock
            .Setup(repository => repository.AddViewAsync(It.IsAny<StoryView>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var service = CreateService();
        await service.MarkAsViewedAsync(storyId, viewerId, CancellationToken.None);

        _storyRepositoryMock.Verify(repository => repository.AddViewAsync(
            It.Is<StoryView>(view => view.StoryId == storyId && view.ViewerId == viewerId),
            It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(unitOfWork => unitOfWork.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

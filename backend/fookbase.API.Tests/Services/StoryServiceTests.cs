using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Stories;
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
    private readonly Mock<IUserIdentityReadModelService> _userIdentityReadModelServiceMock = new();
    private readonly Mock<IFriendshipReadModelService> _friendshipReadModelServiceMock = new();
    private readonly Mock<IUserProfileSummaryReadModelService> _userProfileSummaryReadModelServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly Mock<ILogger<StoryService>> _loggerMock = new();

    private StoryService CreateService()
    {
        _friendshipReadModelServiceMock
            .Setup(service => service.ResolveBlockedUserIdsAsync(
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new HashSet<Guid>());

        _friendshipReadModelServiceMock
            .Setup(service => service.ResolveContactIdsAsync(
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync(new HashSet<Guid>());

        _httpContextAccessorMock
            .SetupGet(accessor => accessor.HttpContext)
            .Returns(new DefaultHttpContext());

        return new StoryService(
            _accessTokenProviderMock.Object,
            _storyRepositoryMock.Object,
            _storyReactionRepositoryMock.Object,
            _userIdentityReadModelServiceMock.Object,
            _friendshipReadModelServiceMock.Object,
            _userProfileSummaryReadModelServiceMock.Object,
            _unitOfWorkMock.Object,
            _httpContextAccessorMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenMediaTypeIsInvalid()
    {
        var service = CreateService();
        var request = new CreateStoryRequestDto
        {
            MediaUrl = "https://cdn.example.com/story.jpg",
            MediaType = "document",
            Content = "hello"
        };

        var exception = await Assert.ThrowsAsync<BusinessException>(() =>
            service.CreateAsync(Guid.NewGuid(), request, CancellationToken.None));

        Assert.Equal(ErrorCode.INVALID_STORY_MEDIA_TYPE, exception.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_AddsStory_AndSavesChanges()
    {
        var userId = Guid.NewGuid();
        Story? addedStory = null;

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
}

using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Domain.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class StoryServiceTests
{
    private readonly Mock<IStoryRepository> _storyRepositoryMock = new();
    private readonly Mock<IStoryReactionRepository> _storyReactionRepositoryMock = new();
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock = new();
    private readonly Mock<IWebHostEnvironment> _webHostEnvironmentMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly Mock<ILogger<StoryService>> _loggerMock = new();

    private StoryService CreateService()
    {
        var options = Options.Create(new CloudinaryOptions());
        return new StoryService(
            _storyRepositoryMock.Object,
            _storyReactionRepositoryMock.Object,
            _javaApiServiceMock.Object,
            _unitOfWorkMock.Object,
            _httpClientFactoryMock.Object,
            _webHostEnvironmentMock.Object,
            _httpContextAccessorMock.Object,
            options,
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

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(userId, request, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_AddsStory_AndSavesChanges()
    {
        var userId = Guid.NewGuid();
        Story? addedStory = null;

        _javaApiServiceMock
            .Setup(service => service.GetUserById(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserDto { Id = userId });
        _javaApiServiceMock
            .Setup(service => service.GetProfileSummaryByUserId(userId, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(new UserProfileSummaryDto
            {
                UserId = userId,
                DisplayName = "Story Owner",
                AvatarUrl = "https://cdn.example.com/avatar.jpg"
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
        Assert.Equal("IMAGE", addedStory.MediaType);
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
                MediaType = "IMAGE",
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
                MediaType = "IMAGE",
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

using System.Net;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class ProfileServiceTests
{
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<IPostRepository> _postRepositoryMock = new();
    private readonly Mock<ILogger<ProfileService>> _loggerMock = new();

    private ProfileService CreateService()
    {
        return new ProfileService(
            _javaApiServiceMock.Object,
            _postRepositoryMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task GetByUserIdAsync_ReturnsNotFound_WhenJavaProfileIsMissing()
    {
        var userId = Guid.NewGuid();
        _javaApiServiceMock
            .Setup(service => service.GetProfileByUserId(userId, It.IsAny<CancellationToken>(), "token"))
            .ReturnsAsync((UserProfileDto?)null);

        var service = CreateService();
        var result = await service.GetByUserIdAsync(userId, "token", CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
    }

    [Fact]
    public async Task GetByUserIdAsync_MapsJavaProfile_AndNormalizesCounts()
    {
        var userId = Guid.NewGuid();
        _javaApiServiceMock
            .Setup(service => service.GetProfileByUserId(userId, It.IsAny<CancellationToken>(), "token"))
            .ReturnsAsync(new UserProfileDto
            {
                UserId = Guid.Empty,
                DisplayName = "  Test User  ",
                AvatarUrl = null,
                FriendsCount = -10,
                PhoneNumber = " 0900 ",
                Gender = " FEMALE ",
                BirthDate = " 2000-01-01 ",
                Status = " ACCEPTED ",
                Nickname = "  tester "
            });

        _postRepositoryMock
            .Setup(repository => repository.CountByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(-1);

        var service = CreateService();
        var result = await service.GetByUserIdAsync(userId, "token", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(userId, result.Data!.UserId);
        Assert.Equal("Test User", result.Data.DisplayName);
        Assert.Equal(0, result.Data.FriendsCount);
        Assert.Equal(0, result.Data.PostsCount);
        Assert.Equal("0900", result.Data.PhoneNumber);
        Assert.Equal("FEMALE", result.Data.Gender);
        Assert.Equal("2000-01-01", result.Data.BirthDate);
        Assert.Equal("ACCEPTED", result.Data.Status);
        Assert.Equal("tester", result.Data.Nickname);
    }

    [Fact]
    public async Task GetByUserIdAsync_ReturnsUnauthorized_WhenJavaApiRejectsToken()
    {
        var userId = Guid.NewGuid();
        _javaApiServiceMock
            .Setup(service => service.GetProfileByUserId(userId, It.IsAny<CancellationToken>(), "token"))
            .ThrowsAsync(new HttpRequestException("forbidden", null, HttpStatusCode.Unauthorized));

        var service = CreateService();
        var result = await service.GetByUserIdAsync(userId, "token", CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(StatusCodes.Status401Unauthorized, result.StatusCode);
    }

    [Fact]
    public async Task GetMyProfileSettingsAsync_ReturnsUnauthorized_WhenAccessTokenIsMissing()
    {
        var service = CreateService();
        var result = await service.GetMyProfileSettingsAsync(Guid.NewGuid(), "  ", CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(StatusCodes.Status401Unauthorized, result.StatusCode);
    }

    [Fact]
    public async Task SearchByPhoneNumberAsync_ReturnsWrappedProfileList_WhenJavaApiSucceeds()
    {
        var expectedProfile = new UserProfileSearchDto
        {
            UserId = Guid.NewGuid().ToString(),
            DisplayName = "Alice",
            PhoneNumber = "0909"
        };

        _javaApiServiceMock
            .Setup(service => service.SearchProfileByPhoneNumberAsync("0909", "token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<UserProfileSearchDto>.Success(expectedProfile, StatusCodes.Status200OK));

        var service = CreateService();
        var result = await service.SearchByPhoneNumberAsync("0909", "token", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data!);
        Assert.Equal(expectedProfile.UserId, result.Data[0].UserId);
    }
}

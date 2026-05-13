using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Services;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class ProfileServiceTests
{
    private readonly Mock<IAccessTokenProvider> _accessTokenProviderMock = new();
    private readonly Mock<IUserProfilePublicReadModelService> _userProfilePublicReadModelServiceMock = new();
    private readonly Mock<IJavaUserProfileApiService> _javaUserProfileApiServiceMock = new();
    private readonly Mock<IPostRepository> _postRepositoryMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

    private ProfileService CreateService()
    {
        _accessTokenProviderMock
            .Setup(provider => provider.GetAccessTokenOrNull())
            .Returns("token");

        _httpContextAccessorMock
            .SetupGet(accessor => accessor.HttpContext)
            .Returns(new DefaultHttpContext());

        return new ProfileService(
            _accessTokenProviderMock.Object,
            _userProfilePublicReadModelServiceMock.Object,
            _javaUserProfileApiServiceMock.Object,
            _postRepositoryMock.Object,
            _httpContextAccessorMock.Object);
    }

    [Fact]
    public async Task GetByUserIdAsync_MapsProfile_AndNormalizesCounts()
    {
        var userId = Guid.NewGuid();
        _userProfilePublicReadModelServiceMock
            .Setup(service => service.GetByUserIdAsync(
                Guid.Empty,
                userId,
                "token",
                It.IsAny<CancellationToken>(),
                false))
            .ReturnsAsync(JavaApiCallResult<UserProfileDto>.Success(new UserProfileDto
            {
                UserId = Guid.Empty,
                DisplayName = "  Test User  ",
                FriendsCount = -10,
                PhoneNumber = " 0900 ",
                Gender = " FEMALE ",
                BirthDate = " 2000-01-01 ",
                Status = " ACCEPTED ",
                Nickname = "  tester "
            }, StatusCodes.Status200OK));

        _postRepositoryMock
            .Setup(repository => repository.CountByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(-1);

        var service = CreateService();
        var result = await service.GetByUserIdAsync(userId, CancellationToken.None);

        Assert.Equal(userId, result.UserId);
        Assert.Equal("Test User", result.DisplayName);
        Assert.Equal(0, result.FriendsCount);
        Assert.Equal(0, result.PostsCount);
        Assert.Equal("0900", result.PhoneNumber);
        Assert.Equal("FEMALE", result.Gender);
        Assert.Equal("2000-01-01", result.BirthDate);
        Assert.Equal("ACCEPTED", result.Status);
        Assert.Equal("tester", result.Nickname);
    }

    [Fact]
    public async Task GetByUserIdAsync_ThrowsNotFound_WhenReadModelReturns404()
    {
        var userId = Guid.NewGuid();
        _userProfilePublicReadModelServiceMock
            .Setup(service => service.GetByUserIdAsync(
                Guid.Empty,
                userId,
                "token",
                It.IsAny<CancellationToken>(),
                false))
            .ReturnsAsync(JavaApiCallResult<UserProfileDto>.Failure(
                StatusCodes.Status404NotFound,
                "not found"));

        var service = CreateService();

        var exception = await Assert.ThrowsAsync<BusinessException>(
            () => service.GetByUserIdAsync(userId, CancellationToken.None));

        Assert.Equal(ErrorCode.NOT_FOUND, exception.ErrorCode);
    }

    [Fact]
    public async Task GetMyProfileSettingsAsync_ThrowsUnauthorized_WhenAccessTokenIsMissing()
    {
        var service = CreateService();

        _accessTokenProviderMock
            .Setup(provider => provider.GetAccessTokenOrNull())
            .Returns(" ");

        var exception = await Assert.ThrowsAsync<BusinessException>(
            () => service.GetMyProfileSettingsAsync(Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(ErrorCode.UNAUTHORIZED, exception.ErrorCode);
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

        _javaUserProfileApiServiceMock
            .Setup(service => service.SearchProfileByPhoneNumberAsync("0909", "token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<UserProfileSearchDto>.Success(expectedProfile, StatusCodes.Status200OK));

        var service = CreateService();
        var result = await service.SearchByPhoneNumberAsync("0909", CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(expectedProfile.UserId, result[0].UserId);
    }
}

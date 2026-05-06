using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Api.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IJavaApiService> _javaApiServiceMock = new();
    private readonly Mock<ITokenRoleService> _tokenRoleServiceMock = new();
    private readonly Mock<IAuthCookieService> _authCookieServiceMock = new();

    private AuthController CreateController(HttpContext? httpContext = null)
    {
        return new AuthController(
            _javaApiServiceMock.Object,
            _tokenRoleServiceMock.Object,
            _authCookieServiceMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext ?? new DefaultHttpContext()
            }
        };
    }

    [Fact]
    public async Task Login_ReturnsOk_NormalizesToken_AndSetsCookies()
    {
        var request = new LoginRequestDto
        {
            Username = "tester",
            Password = "secret"
        };
        var payload = new LoginResponseDto
        {
            Token = " Bearer access-token ",
            RefreshToken = "refresh-token",
            Role = "USER",
            UserId = Guid.NewGuid(),
            DisplayName = "Tester"
        };

        _javaApiServiceMock
            .Setup(service => service.LoginAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<LoginResponseDto>.Success(payload, StatusCodes.Status200OK));

        var httpContext = new DefaultHttpContext();
        var controller = CreateController(httpContext);

        var result = await controller.Login(request, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var response = Assert.IsType<ApiResponse<LoginResponseDto>>(objectResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("access-token", response.Data!.Token);
        Assert.Equal("access-token", response.Data.AccessToken);

        _authCookieServiceMock.Verify(
            service => service.SetLoginCookies(httpContext, "access-token", "refresh-token"),
            Times.Once);
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_AndDoesNotSetCookies_WhenJavaApiRejectsCredentials()
    {
        var request = new LoginRequestDto
        {
            Username = "tester",
            Password = "wrong-password"
        };

        _javaApiServiceMock
            .Setup(service => service.LoginAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(JavaApiCallResult<LoginResponseDto>.Failure(
                StatusCodes.Status401Unauthorized,
                "Invalid username or password."));

        var controller = CreateController();

        var result = await controller.Login(request, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);

        var response = Assert.IsType<ApiResponse<LoginResponseDto>>(objectResult.Value);
        Assert.False(response.Success);
        Assert.Contains("Invalid username or password.", response.Errors);

        _authCookieServiceMock.Verify(
            service => service.SetLoginCookies(It.IsAny<HttpContext>(), It.IsAny<string>(), It.IsAny<string?>()),
            Times.Never);
    }
}

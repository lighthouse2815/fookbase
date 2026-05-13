using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Models;
using InteractHub.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Api.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock = new();

    private AuthController CreateController()
    {
        return new AuthController(_authServiceMock.Object);
    }

    [Fact]
    public async Task Login_ReturnsOk_WithServiceResponse()
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

        _authServiceMock
            .Setup(service => service.LoginAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payload);

        var controller = CreateController();

        var result = await controller.Login(request, CancellationToken.None);

        var objectResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode ?? StatusCodes.Status200OK);

        var response = Assert.IsType<ApiResponse<LoginResponseDto>>(objectResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(payload.Token, response.Data!.Token);
        Assert.Equal(payload.AccessToken, response.Data.AccessToken);
    }

    [Fact]
    public async Task Login_PropagatesException_FromAuthService()
    {
        var request = new LoginRequestDto
        {
            Username = "tester",
            Password = "wrong-password"
        };

        _authServiceMock
            .Setup(service => service.LoginAsync(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var controller = CreateController();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => controller.Login(request, CancellationToken.None));
    }
}

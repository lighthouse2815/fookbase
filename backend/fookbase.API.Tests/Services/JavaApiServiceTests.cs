using System.Net;
using System.Text;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using InteractHub.Api.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace InteractHub.Api.Tests.Services;

public class JavaApiServiceTests
{
    [Fact]
    public async Task GetUserById_UsesExplicitToken_InsteadOfProviderToken()
    {
        var userId = Guid.NewGuid();
        var providerMock = new Mock<IAccessTokenProvider>(MockBehavior.Strict);
        string? authorizationHeader = null;

        var service = CreateService(
            providerMock,
            (request, _) =>
            {
                authorizationHeader = request.Headers.Authorization?.ToString();
                return Task.FromResult(CreateOkUserResponse(userId));
            });

        var result = await service.GetUserById(userId, CancellationToken.None, "Bearer explicit-token");

        Assert.NotNull(result);
        Assert.Equal(userId, result!.Id);
        Assert.Equal("Bearer explicit-token", authorizationHeader);
        providerMock.Verify(provider => provider.GetAccessTokenOrNull(), Times.Never);
    }

    [Fact]
    public async Task GetUserById_UsesProviderToken_WhenExplicitTokenMissing()
    {
        var userId = Guid.NewGuid();
        var providerMock = new Mock<IAccessTokenProvider>(MockBehavior.Strict);
        providerMock
            .Setup(provider => provider.GetAccessTokenOrNull())
            .Returns("provider-token");

        string? authorizationHeader = null;

        var service = CreateService(
            providerMock,
            (request, _) =>
            {
                authorizationHeader = request.Headers.Authorization?.ToString();
                return Task.FromResult(CreateOkUserResponse(userId));
            });

        var result = await service.GetUserById(userId, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(userId, result!.Id);
        Assert.Equal("Bearer provider-token", authorizationHeader);
        providerMock.Verify(provider => provider.GetAccessTokenOrNull(), Times.Once);
    }

    private static JavaApiService CreateService(
        Mock<IAccessTokenProvider> accessTokenProviderMock,
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responseFactory)
    {
        var handler = new StubHttpMessageHandler(responseFactory);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://java-api.local/", UriKind.Absolute)
        };

        var options = Options.Create(new JavaApiOptions());
        var logger = new Mock<ILogger<JavaApiService>>();

        return new JavaApiService(
            httpClient,
            options,
            logger.Object,
            accessTokenProviderMock.Object);
    }

    private static HttpResponseMessage CreateOkUserResponse(Guid userId)
    {
        var body = $"{{\"id\":\"{userId}\"}}";
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _responseFactory;

        public StubHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return _responseFactory(request, cancellationToken);
        }
    }
}

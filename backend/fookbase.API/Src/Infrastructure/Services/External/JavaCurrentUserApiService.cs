using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaCurrentUserApiService : IJavaCurrentUserApiService
{
    private readonly JavaApiTransport _transport;
    private readonly JavaApiCurrentUserOptions _options;

    public JavaCurrentUserApiService(
        HttpClient httpClient,
        IOptions<JavaApiCurrentUserOptions> options,
        ILogger<JavaCurrentUserApiService> logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _transport = new JavaApiTransport(httpClient, logger, accessTokenProvider);
        _options = options.Value;
    }

    public Task<JavaApiCallResult<UserSecurityPrivateDto>> GetMySecurityPrivateProfileAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeSecurityPrivatePathTemplate);
        return _transport.GetResultAsync<UserSecurityPrivateDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> UpdateMySecurityPrivateProfileAsync(
        string resetToken,
        UpdateSecurityAccountRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeSecurityPrivateUpdatePathTemplate);
        var additionalHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["X-Reset-Token"] = resetToken
        };

        return _transport.PatchNoContentAsync(
            path,
            request,
            cancellationToken,
            accessToken: accessToken,
            additionalHeaders: additionalHeaders);
    }
}




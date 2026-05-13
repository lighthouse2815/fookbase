using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Enums;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaAdminApiService : IJavaAdminApiService
{
    private readonly JavaApiTransport _transport;
    private readonly JavaApiAdminOptions _options;

    public JavaAdminApiService(
        HttpClient httpClient,
        IOptions<JavaApiAdminOptions> options,
        ILogger<JavaAdminApiService> logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _transport = new JavaApiTransport(httpClient, logger, accessTokenProvider);
        _options = options.Value;
    }

    public async Task<JavaApiCallResult<List<AdminUserSearchDto>>> SearchAdminUsersAsync(
        string? keyword,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.SearchUsersPathTemplate, ("keyword", keyword?.Trim() ?? string.Empty));
        var result = await _transport.GetResultAsync<List<AdminUserSearchDto>>(path, accessToken, cancellationToken);

        if (result.IsSuccess && result.Data is null)
        {
            return JavaApiCallResult<List<AdminUserSearchDto>>.Success(
                new List<AdminUserSearchDto>(),
                JavaApiResultHelper.ResolveSuccessStatusCode(result.StatusCode));
        }

        return result;
    }

    public Task<JavaApiCallResult<AdminUserSearchDto>> UpdateAdminUserStatusAsync(
        Guid userId,
        UserStatus status,
        string? accessToken = null,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.UpdateUserStatusPathTemplate, ("userId", userId));
        return _transport.PatchAsync<AdminUserSearchDto>(
            path,
            new { status = status.ToString() },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<AdminUserStatsDto>> GetAdminUserStatsAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.UserStatsPathTemplate);
        return _transport.GetResultAsync<AdminUserStatsDto>(path, accessToken, cancellationToken);
    }
}




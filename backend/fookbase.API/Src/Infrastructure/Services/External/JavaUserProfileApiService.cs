using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Net;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaUserProfileApiService : IJavaUserProfileApiService
{
    private readonly JavaApiTransport _transport;
    private readonly JavaApiUserProfileOptions _options;

    public JavaUserProfileApiService(
        HttpClient httpClient,
        IOptions<JavaApiUserProfileOptions> options,
        ILogger<JavaUserProfileApiService> logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _transport = new JavaApiTransport(httpClient, logger, accessTokenProvider);
        _options = options.Value;
    }

    public Task<JavaApiCallResult<UserProfileDto>> GetProfileByUserIdAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileByUserIdPathTemplate, ("userId", userId));
        return _transport.GetResultAsync<UserProfileDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<UserProfileOverviewDto>> GetMyProfileOverviewAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeOverviewPathTemplate);
        return _transport.GetResultAsync<UserProfileOverviewDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<ProfileInfoSettingsDto>> GetMyProfileInfoSettingsAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeInfoSettingsPathTemplate);
        return _transport.GetResultAsync<ProfileInfoSettingsDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<ProfileInfoVisibilityDto>> GetMyProfileInfoVisibilityAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeInfoSettingsVisibilityPathTemplate);
        return _transport.GetResultAsync<ProfileInfoVisibilityDto>(path, accessToken, cancellationToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> UpdateMyProfileInfoVisibilityAsync(
        UpdateProfileInfoVisibilityRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeInfoSettingsVisibilityUpdatePathTemplate);
        return _transport.PatchNoContentAsync(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileMeUpdatePathTemplate);
        return _transport.PatchNoContentAsync(path, request, cancellationToken, accessToken: accessToken);
    }

    public Task<JavaApiCallResult<UserProfileSearchDto>> SearchProfileByPhoneNumberAsync(
        string phoneNumber,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileSearchByPhonePathTemplate, ("phoneNumber", phoneNumber));
        return _transport.GetResultAsync<UserProfileSearchDto>(path, accessToken, cancellationToken);
    }

    public async Task<JavaApiCallResult<List<UserProfileSearchDto>>> SearchProfilesByDisplayNameAsync(
        string displayName,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileSearchByDisplayNamePathTemplate, ("displayName", displayName));
        var result = await _transport.GetResultAsync<List<UserProfileSearchDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public Task<UserProfileSummaryDto?> GetProfileSummaryByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = JavaApiTransport.BuildPath(_options.ProfileSummaryByUserIdPathTemplate, ("userId", userId));
        return _transport.GetAsync<UserProfileSummaryDto>(path, accessToken, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, UserProfileSummaryDto>> GetProfileSummariesByUserIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto>();
        }

        var distinctUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto>();
        }

        var path = JavaApiTransport.BuildPath(_options.ProfileSummariesByUserIdsPathTemplate);
        var result = await _transport.PostAsync<List<UserProfileSummaryDto>>(
            path,
            new { userIds = distinctUserIds },
            cancellationToken,
            accessToken: accessToken);

        if (!result.IsSuccess)
        {
            var resolvedStatusCode = JavaApiResultHelper.ResolveStatusCode(
                result.StatusCode,
                StatusCodes.Status502BadGateway);

            var resolvedErrorMessage = JavaApiResultHelper.ResolveErrorMessage(
                result.ErrorMessage,
                $"Java API call to '{path}' failed with status code {resolvedStatusCode}.");

            throw new HttpRequestException(
                resolvedErrorMessage,
                inner: null,
                statusCode: (HttpStatusCode)resolvedStatusCode);
        }

        if (result.Data is null || result.Data.Count == 0)
        {
            return new Dictionary<Guid, UserProfileSummaryDto>();
        }

        return result.Data
            .Where(profile => profile is not null && profile.UserId != Guid.Empty)
            .GroupBy(profile => profile.UserId)
            .ToDictionary(group => group.Key, group => group.Last());
    }

    private static JavaApiCallResult<List<TItem>> NormalizeListResult<TItem>(JavaApiCallResult<List<TItem>> result)
    {
        if (result.IsSuccess && result.Data is null)
        {
            return JavaApiCallResult<List<TItem>>.Success(
                new List<TItem>(),
                JavaApiResultHelper.ResolveSuccessStatusCode(result.StatusCode));
        }

        return result;
    }
}

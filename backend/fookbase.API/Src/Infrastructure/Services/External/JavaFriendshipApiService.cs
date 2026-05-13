using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Options;
using InteractHub.Api.Common.Utilities;
using Microsoft.Extensions.Options;

namespace InteractHub.Api.Infrastructure.Services;

public class JavaFriendshipApiService : IJavaFriendshipApiService
{
    private readonly JavaApiTransport _transport;
    private readonly JavaApiFriendshipOptions _options;

    public JavaFriendshipApiService(
        HttpClient httpClient,
        IOptions<JavaApiFriendshipOptions> options,
        ILogger<JavaFriendshipApiService> logger,
        IAccessTokenProvider accessTokenProvider)
    {
        _transport = new JavaApiTransport(httpClient, logger, accessTokenProvider);
        _options = options.Value;
    }

    public async Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null)
    {
        var path = JavaApiTransport.BuildPath(_options.FriendsByUserIdPathTemplate, ("userId", userId));
        var friends = await _transport.GetAsync<List<FriendshipDto>>(path, accessToken, cancellationToken);
        return friends ?? new List<FriendshipDto>();
    }

    public async Task<JavaApiCallResult<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(
        string accessToken,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePage = page < 0 ? 0 : page;
        var safePageSize = pageSize <= 0 ? 20 : pageSize;
        var path = JavaApiTransport.BuildPath(_options.UserSuggestionsPathTemplate, ("page", safePage), ("size", safePageSize));
        var result = await _transport.GetResultAsync<List<FriendSuggestionDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public async Task<JavaApiCallResult<List<PendingFriendRequesterDto>>> GetPendingRequestersAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerPendingRequestersPathTemplate);
        var result = await _transport.GetResultAsync<List<PendingFriendRequesterDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public async Task<JavaApiCallResult<List<ContactDto>>> GetContactsByUserAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerContactsByUserPathTemplate);
        var result = await _transport.GetResultAsync<List<ContactDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public async Task<JavaApiCallResult<List<UserProfilePresenceDto>>> GetFriendPresenceAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.FriendPresencePathTemplate);
        var result = await _transport.GetResultAsync<List<UserProfilePresenceDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public Task<JavaApiCallResult<FriendshipResponseDto>> SendFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerSendFriendRequestPathTemplate);
        return _transport.PostAsync<FriendshipResponseDto>(
            path,
            new { userId, addresseeId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<FriendshipResponseDto>> AcceptFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerAcceptFriendRequestPathTemplate);
        return _transport.PostAsync<FriendshipResponseDto>(
            path,
            new { userId, requestId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> RejectFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerRejectFriendRequestPathTemplate);
        return _transport.PostNoContentAsync(
            path,
            new { userId, requestId = userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> UnfriendAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerUnfriendPathTemplate);
        return _transport.DeleteNoContentAsync(
            path,
            new { userId },
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> BlockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerBlockUserPathTemplate, ("userId", userId));
        return _transport.PostNoContentAsync(
            path,
            payload: null,
            cancellationToken,
            accessToken: accessToken);
    }

    public Task<JavaApiCallResult<NoContentDto>> UnblockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerUnblockUserPathTemplate, ("userId", userId));
        return _transport.DeleteNoContentAsync(
            path,
            payload: null,
            cancellationToken,
            accessToken: accessToken);
    }

    public async Task<JavaApiCallResult<List<BlockedUserDto>>> GetBlockedUsersAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerBlockedUsersPathTemplate);
        var result = await _transport.GetResultAsync<List<BlockedUserDto>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
    }

    public async Task<JavaApiCallResult<List<string>>> GetBlockedUserIdsAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        var path = JavaApiTransport.BuildPath(_options.MessengerBlockedUserIdsPathTemplate);
        var result = await _transport.GetResultAsync<List<string>>(path, accessToken, cancellationToken);
        return NormalizeListResult(result);
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

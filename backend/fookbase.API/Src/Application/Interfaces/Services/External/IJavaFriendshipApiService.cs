using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaFriendshipApiService
{
    Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<JavaApiCallResult<List<FriendSuggestionDto>>> GetFriendSuggestionsAsync(
        string accessToken,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<PendingFriendRequesterDto>>> GetPendingRequestersAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<ContactDto>>> GetContactsByUserAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<UserProfilePresenceDto>>> GetFriendPresenceAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<FriendshipResponseDto>> SendFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<FriendshipResponseDto>> AcceptFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> RejectFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> UnfriendAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> BlockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> UnblockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<BlockedUserDto>>> GetBlockedUsersAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<string>>> GetBlockedUserIdsAsync(
        string accessToken,
        CancellationToken cancellationToken = default);
}

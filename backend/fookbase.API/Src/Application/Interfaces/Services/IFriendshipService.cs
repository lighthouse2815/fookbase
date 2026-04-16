using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IFriendshipService
{
    Task<JavaApiCallResult<List<PendingFriendRequesterDto>>> GetPendingRequestersAsync(
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<List<ContactDto>>> GetContactsAsync(
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<List<UserProfilePresenceDto>>> GetFriendPresenceAsync(
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<List<FriendSuggestionResponseDto>>> GetSuggestionsAsync(
        string? accessToken,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<FriendshipResponseDto>> SendFriendRequestAsync(
        SendFriendRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<FriendshipResponseDto>> AcceptFriendRequestAsync(
        FriendRequestActionDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<object?>> RejectFriendRequestAsync(
        FriendRequestActionDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<object?>> UnfriendAsync(
        UnfriendActionDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<object?>> BlockUserAsync(
        BlockUserActionDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<object?>> UnblockUserAsync(
        string targetUserId,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<List<BlockedUserResponseDto>>> GetBlockedUsersAsync(
        string? accessToken,
        CancellationToken cancellationToken);
}

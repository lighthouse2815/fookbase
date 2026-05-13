using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IFriendshipService
{
    Task<List<PendingFriendRequesterDto>> GetPendingRequestersAsync(
        CancellationToken cancellationToken);

    Task<List<ContactDto>> GetContactsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken);

    Task<List<UserProfilePresenceDto>> GetFriendPresenceAsync(
        CancellationToken cancellationToken);

    Task<List<FriendSuggestionResponseDto>> GetSuggestionsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<FriendshipResponseDto> SendFriendRequestAsync(
        SendFriendRequestDto request,
        CancellationToken cancellationToken);

    Task<FriendshipResponseDto> AcceptFriendRequestAsync(
        FriendRequestActionDto request,
        CancellationToken cancellationToken);

    Task RejectFriendRequestAsync(
        FriendRequestActionDto request,
        CancellationToken cancellationToken);

    Task UnfriendAsync(
        UnfriendActionDto request,
        CancellationToken cancellationToken);

    Task BlockUserAsync(
        BlockUserActionDto request,
        CancellationToken cancellationToken);

    Task UnblockUserAsync(
        string targetUserId,
        CancellationToken cancellationToken);

    Task<List<BlockedUserResponseDto>> GetBlockedUsersAsync(
        Guid currentUserId,
        CancellationToken cancellationToken);
}






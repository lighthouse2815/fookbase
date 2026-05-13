using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Services;

public class FriendshipService : IFriendshipService
{
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IJavaFriendshipApiService _javaFriendshipApiService;
    private readonly IFriendshipReadModelService _friendshipReadModelService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;

    public FriendshipService(
        IAccessTokenProvider accessTokenProvider,
        IJavaFriendshipApiService javaFriendshipApiService,
        IFriendshipReadModelService friendshipReadModelService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService)
    {
        _accessTokenProvider = accessTokenProvider;
        _javaFriendshipApiService = javaFriendshipApiService;
        _friendshipReadModelService = friendshipReadModelService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
    }

    public async Task<List<PendingFriendRequesterDto>> GetPendingRequestersAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaFriendshipApiService.GetPendingRequestersAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Load pending friend requests failed.");
    }

    public async Task<List<ContactDto>> GetContactsAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var contactIds = await _friendshipReadModelService.ResolveContactIdsAsync(
            currentUserId,
            accessToken,
            cancellationToken,
            requireFresh: false);

        contactIds.Remove(currentUserId);
        if (contactIds.Count == 0)
        {
            return new List<ContactDto>();
        }

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            contactIds,
            cancellationToken,
            requireFresh: false,
            accessToken: accessToken);

        return FriendshipMapper.ToContactDtos(
            contactIds,
            profileLookup,
            fallbackDisplayName: "user");
    }

    public async Task<List<UserProfilePresenceDto>> GetFriendPresenceAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaFriendshipApiService.GetFriendPresenceAsync(accessToken, cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Load friend presence failed.");
    }

    public async Task<List<FriendSuggestionResponseDto>> GetSuggestionsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var safePage = page < 0 ? 0 : page;
        var safePageSize = Math.Clamp(pageSize, 1, 100);

        var result = await _javaFriendshipApiService.GetFriendSuggestionsAsync(
            accessToken,
            safePage,
            safePageSize,
            cancellationToken);

        var suggestions = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Load friend suggestions failed.");

        return suggestions.ToResponseDtos();
    }

    public async Task<FriendshipResponseDto> SendFriendRequestAsync(
        SendFriendRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var targetUserId = request.AddresseeId?.Trim();
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "addresseeId is required.");
        }

        var result = await _javaFriendshipApiService.SendFriendRequestAsync(
            targetUserId,
            accessToken,
            cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Send friend request failed.");
    }

    public async Task<FriendshipResponseDto> AcceptFriendRequestAsync(
        FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var targetUserId = request.RequestId?.Trim();
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "requestId is required.");
        }

        var result = await _javaFriendshipApiService.AcceptFriendRequestAsync(
            targetUserId,
            accessToken,
            cancellationToken);

        return JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Accept friend request failed.");
    }

    public async Task RejectFriendRequestAsync(
        FriendRequestActionDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var targetUserId = request.RequestId?.Trim();
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "requestId is required.");
        }

        var result = await _javaFriendshipApiService.RejectFriendRequestAsync(
            targetUserId,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Reject friend request failed.");
    }

    public async Task UnfriendAsync(
        UnfriendActionDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var targetUserId = request.FriendId?.Trim();
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "friendId is required.");
        }

        var result = await _javaFriendshipApiService.UnfriendAsync(
            targetUserId,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Unfriend failed.");
    }

    public async Task BlockUserAsync(
        BlockUserActionDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var targetUserId = request.TargetUserId?.Trim();
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "targetUserId is required.");
        }

        var result = await _javaFriendshipApiService.BlockUserAsync(
            targetUserId,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Block user failed.");
    }

    public async Task UnblockUserAsync(
        string targetUserId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var normalizedTargetUserId = targetUserId?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedTargetUserId))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "targetUserId is required.");
        }

        var result = await _javaFriendshipApiService.UnblockUserAsync(
            normalizedTargetUserId,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Unblock user failed.");
    }

    public async Task<List<BlockedUserResponseDto>> GetBlockedUsersAsync(
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        if (currentUserId == Guid.Empty)
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "currentUserId is required.");
        }

        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var blockedUserLookup = await _friendshipReadModelService.ResolveBlockedUsersAsync(
            currentUserId,
            accessToken,
            cancellationToken,
            requireFresh: false);

        if (blockedUserLookup.Count == 0)
        {
            return new List<BlockedUserResponseDto>();
        }

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            blockedUserLookup.Keys,
            cancellationToken,
            requireFresh: false,
            accessToken: accessToken);

        return FriendshipMapper.ToResponseDtos(
            blockedUserLookup,
            profileLookup);
    }
}

using InteractHub.Api.Application.DTOs.Friendships;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Application.Services;

public class FriendshipService : IFriendshipService
{
    private readonly IJavaApiService _javaApiService;

    public FriendshipService(IJavaApiService javaApiService)
    {
        _javaApiService = javaApiService;
    }

    public async Task<JavaApiCallResult<List<PendingFriendRequesterDto>>> GetPendingRequestersAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<List<PendingFriendRequesterDto>>();
        }

        var result = await _javaApiService.GetPendingRequestersAsync(accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<List<PendingFriendRequesterDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Load pending friend requests failed.");
        }

        return JavaApiCallResult<List<PendingFriendRequesterDto>>.Success(result.Data, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<List<ContactDto>>> GetContactsAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<List<ContactDto>>();
        }

        var result = await _javaApiService.GetContactsByUserAsync(accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<List<ContactDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Load contacts failed.");
        }

        return JavaApiCallResult<List<ContactDto>>.Success(result.Data, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<List<UserProfilePresenceDto>>> GetFriendPresenceAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<List<UserProfilePresenceDto>>();
        }

        var result = await _javaApiService.GetFriendPresenceAsync(accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<List<UserProfilePresenceDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Load friend presence failed.");
        }

        return JavaApiCallResult<List<UserProfilePresenceDto>>.Success(result.Data, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<List<FriendSuggestionResponseDto>>> GetSuggestionsAsync(
        string? accessToken,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<List<FriendSuggestionResponseDto>>();
        }

        var safePage = page < 0 ? 0 : page;
        var safePageSize = Math.Clamp(pageSize, 1, 100);

        var result = await _javaApiService.GetFriendSuggestionsAsync(accessToken.Trim(), safePage, safePageSize, cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<List<FriendSuggestionResponseDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Load friend suggestions failed.");
        }

        var mapped = result.Data
            .Select((item, index) => item.ToResponseDto(index))
            .ToList();

        return JavaApiCallResult<List<FriendSuggestionResponseDto>>.Success(mapped, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<FriendshipResponseDto>> SendFriendRequestAsync(
        SendFriendRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<FriendshipResponseDto>();
        }

        var targetUserId = ResolveTargetUserId(request.AddresseeId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<FriendshipResponseDto>("addresseeId or userId is required.");
        }

        var result = await _javaApiService.SendFriendRequestAsync(targetUserId, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<FriendshipResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Send friend request failed.");
        }

        return JavaApiCallResult<FriendshipResponseDto>.Success(result.Data, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<FriendshipResponseDto>> AcceptFriendRequestAsync(
        FriendRequestActionDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<FriendshipResponseDto>();
        }

        var targetUserId = ResolveTargetUserId(request.RequestId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<FriendshipResponseDto>("requestId or userId is required.");
        }

        var result = await _javaApiService.AcceptFriendRequestAsync(targetUserId, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<FriendshipResponseDto>(
                result.StatusCode,
                result.ErrorMessage,
                "Accept friend request failed.");
        }

        return JavaApiCallResult<FriendshipResponseDto>.Success(result.Data, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<object?>> RejectFriendRequestAsync(
        FriendRequestActionDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<object?>();
        }

        var targetUserId = ResolveTargetUserId(request.RequestId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<object?>("requestId or userId is required.");
        }

        var result = await _javaApiService.RejectFriendRequestAsync(targetUserId, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildFailure<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Reject friend request failed.");
        }

        return JavaApiCallResult<object?>.Success(data: null, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<object?>> UnfriendAsync(
        UnfriendActionDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<object?>();
        }

        var targetUserId = ResolveTargetUserId(request.FriendId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<object?>("friendId or userId is required.");
        }

        var result = await _javaApiService.UnfriendAsync(targetUserId, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildFailure<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Unfriend failed.");
        }

        return JavaApiCallResult<object?>.Success(data: null, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<object?>> BlockUserAsync(
        BlockUserActionDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<object?>();
        }

        var targetUserId = ResolveTargetUserId(request.TargetUserId, request.UserId);
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<object?>("targetUserId or userId is required.");
        }

        var result = await _javaApiService.BlockUserAsync(targetUserId, accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildFailure<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Block user failed.");
        }

        return JavaApiCallResult<object?>.Success(data: null, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<object?>> UnblockUserAsync(
        string targetUserId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<object?>();
        }

        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return BadRequestResult<object?>("targetUserId is required.");
        }

        var result = await _javaApiService.UnblockUserAsync(targetUserId.Trim(), accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess)
        {
            return BuildFailure<object?>(
                result.StatusCode,
                result.ErrorMessage,
                "Unblock user failed.");
        }

        return JavaApiCallResult<object?>.Success(data: null, ResolveSuccessStatusCode(result.StatusCode));
    }

    public async Task<JavaApiCallResult<List<BlockedUserResponseDto>>> GetBlockedUsersAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return UnauthorizedResult<List<BlockedUserResponseDto>>();
        }

        var result = await _javaApiService.GetBlockedUsersAsync(accessToken.Trim(), cancellationToken);
        if (!result.IsSuccess || result.Data is null)
        {
            return BuildFailure<List<BlockedUserResponseDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Load blocked users failed.");
        }

        var mapped = result.Data
            .Select((item, index) => item.ToResponseDto(index))
            .ToList();

        return JavaApiCallResult<List<BlockedUserResponseDto>>.Success(mapped, ResolveSuccessStatusCode(result.StatusCode));
    }

    private static JavaApiCallResult<T> UnauthorizedResult<T>()
    {
        return JavaApiCallResult<T>.Failure(StatusCodes.Status401Unauthorized, "Unauthorized.");
    }

    private static JavaApiCallResult<T> BadRequestResult<T>(string errorMessage)
    {
        return JavaApiCallResult<T>.Failure(StatusCodes.Status400BadRequest, errorMessage);
    }

    private static string ResolveTargetUserId(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate))
            {
                return candidate.Trim();
            }
        }

        return string.Empty;
    }

    private static int ResolveSuccessStatusCode(int statusCode)
    {
        return statusCode > 0
            ? statusCode
            : StatusCodes.Status200OK;
    }

    private static JavaApiCallResult<TDestination> BuildFailure<TDestination>(
        int statusCode,
        string? errorMessage,
        string fallbackError)
    {
        var resolvedStatusCode = statusCode > 0
            ? statusCode
            : StatusCodes.Status502BadGateway;

        var resolvedErrorMessage = string.IsNullOrWhiteSpace(errorMessage)
            ? fallbackError
            : errorMessage;

        return JavaApiCallResult<TDestination>.Failure(resolvedStatusCode, resolvedErrorMessage);
    }
}

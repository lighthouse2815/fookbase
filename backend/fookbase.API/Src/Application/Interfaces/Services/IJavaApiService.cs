using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaApiService
{
    Task<UserDto?> GetUserById(
        Guid id,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<UserProfileDto?> GetProfileByUserId(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<UserProfileSummaryDto?> GetProfileSummaryByUserId(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<JavaApiCallResult<UserProfilePrivateDto>> GetPrivateProfileByUserIdAsync(
        Guid userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<UserProfileOverviewDto>> GetMyProfileOverviewAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<UserProfileSearchDto>> SearchProfileByPhoneNumberAsync(
        string phoneNumber,
        string accessToken,
        CancellationToken cancellationToken = default);

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

    Task<JavaApiCallResult<object?>> RejectFriendRequestAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> UnfriendAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<RegisterResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendResetPasswordOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyEmailOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenNotLoginAsync(
        VerifyOtpRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyResetPasswordOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<MessageResponseDto>> ResetPasswordAsync(
        string resetToken,
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default);
}

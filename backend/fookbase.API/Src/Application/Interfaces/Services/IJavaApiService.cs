using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.DTOs.Users;

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

    Task<JavaApiCallResult<ProfileInfoSettingsDto>> GetMyProfileInfoSettingsAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<ProfileInfoVisibilityDto>> GetMyProfileInfoVisibilityAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> UpdateMyProfileInfoVisibilityAsync(
        UpdateProfileInfoVisibilityRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<UserSecurityPrivateDto>> GetMySecurityPrivateProfileAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> UpdateMySecurityPrivateProfileAsync(
        string resetToken,
        UpdateSecurityAccountRequestDto request,
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

    Task<JavaApiCallResult<List<UserProfileSearchDto>>> SearchProfilesByDisplayNameAsync(
        string displayName,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<AdminUserSearchDto>>> SearchAdminUsersAsync(
        string? keyword,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<AdminUserSearchDto>> UpdateAdminUserStatusAsync(
        Guid userId,
        string status,
        string? accessToken = null,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<AdminUserStatsDto>> GetAdminUserStatsAsync(
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

    Task<JavaApiCallResult<object?>> BlockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> UnblockUserAsync(
        string userId,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<List<BlockedUserDto>>> GetBlockedUsersAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<RegisterResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<GoogleAuthResponseDto>> AuthWithGoogleAsync(
        GoogleTokenRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<TokenResponseDto>> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<object?>> LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenNotLoginAsync(
        OtpRequestDto request,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendVerifyEmailOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendChangeUsernameOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> SendChangePhoneNumberOtpWhenLoginAsync(
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyChangeUsernameOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<OtpVerifyResponseDto>> VerifyChangePhoneNumberOtpWhenLoginAsync(
        VerifyOtpRequestDto request,
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

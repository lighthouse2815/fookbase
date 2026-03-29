using InteractHub.Api.Application.DTOs.Auth;
using InteractHub.Api.Application.DTOs.JavaApi;

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

    Task<List<FriendshipDto>> GetFriends(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

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

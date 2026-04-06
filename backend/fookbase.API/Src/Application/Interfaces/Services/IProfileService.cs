using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IProfileService
{
    Task<JavaApiCallResult<ProfileResponseDto>> GetByUserIdAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<MyProfileSettingsResponseDto>> GetMyProfileSettingsAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<object?>> UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken);

    Task<JavaApiCallResult<List<UserProfileSearchDto>>> SearchByPhoneNumberAsync(
        string phoneNumber,
        string? accessToken,
        CancellationToken cancellationToken);
}

using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IProfileService
{
    Task<ProfileResponseDto> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<MyProfileSettingsResponseDto> GetMyProfileSettingsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<ProfilePageInfoSettingsResponseDto> GetMyProfilePageInfoSettingsAsync(
        CancellationToken cancellationToken);

    Task<ProfileInfoVisibilityResponseDto> GetMyProfilePageInfoVisibilityAsync(
        CancellationToken cancellationToken);

    Task UpdateMyProfilePageInfoVisibilityAsync(
        UpdateProfileInfoVisibilityRequestDto request,
        CancellationToken cancellationToken);

    Task UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        CancellationToken cancellationToken);

    Task<List<UserProfileSearchDto>> SearchByPhoneNumberAsync(
        string phoneNumber,
        CancellationToken cancellationToken);

    Task<List<UserProfileSearchDto>> SearchByDisplayNameAsync(
        string displayName,
        CancellationToken cancellationToken);
}






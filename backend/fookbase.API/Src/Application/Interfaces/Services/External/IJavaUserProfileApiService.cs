using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;

namespace InteractHub.Api.Application.Interfaces.Services;

public interface IJavaUserProfileApiService
{
    Task<JavaApiCallResult<UserProfileDto>> GetProfileByUserIdAsync(
        Guid userId,
        string? accessToken,
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

    Task<JavaApiCallResult<NoContentDto>> UpdateMyProfileInfoVisibilityAsync(
        UpdateProfileInfoVisibilityRequestDto request,
        string accessToken,
        CancellationToken cancellationToken = default);

    Task<JavaApiCallResult<NoContentDto>> UpdateMyProfileAsync(
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

    Task<UserProfileSummaryDto?> GetProfileSummaryByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default,
        string? accessToken = null);

    Task<IReadOnlyDictionary<Guid, UserProfileSummaryDto>> GetProfileSummariesByUserIdsAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken = default,
        string? accessToken = null);
}

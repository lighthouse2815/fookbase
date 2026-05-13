using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IUserProfilePublicReadModelService _userProfilePublicReadModelService;
    private readonly IJavaUserProfileApiService _javaUserProfileApiService;
    private readonly IPostRepository _postRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ProfileService(
        IAccessTokenProvider accessTokenProvider,
        IUserProfilePublicReadModelService userProfilePublicReadModelService,
        IJavaUserProfileApiService javaUserProfileApiService,
        IPostRepository postRepository,
        IHttpContextAccessor httpContextAccessor)
    {
        _accessTokenProvider = accessTokenProvider;
        _userProfilePublicReadModelService = userProfilePublicReadModelService;
        _javaUserProfileApiService = javaUserProfileApiService;
        _postRepository = postRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ProfileResponseDto> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();
        var requesterUserId = _httpContextAccessor.HttpContext?.User.TryGetUserId(out var parsedRequesterUserId) == true
            ? parsedRequesterUserId
            : Guid.Empty;
        var profileResult = await _userProfilePublicReadModelService.GetByUserIdAsync(
            requesterUserId,
            userId,
            accessToken,
            cancellationToken,
            requireFresh: false);

        if (!profileResult.IsSuccess)
        {
            if (profileResult.StatusCode is StatusCodes.Status401Unauthorized or StatusCodes.Status403Forbidden)
            {
                throw new BusinessException(ErrorCode.UNAUTHORIZED);
            }

            if (profileResult.StatusCode == StatusCodes.Status404NotFound)
            {
                throw new BusinessException(ErrorCode.NOT_FOUND, "Profile not found.");
            }

            JavaApiResultHelper.EnsureSuccessOrThrow(
                profileResult,
                "Load profile failed.",
                fallbackStatusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var profile = profileResult.Data;
        if (profile is null)
        {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Profile not found.");
        }

        var relationshipStatus = ProfileMapper.FirstNonEmpty(profile.Status);
        var isBlockedRelationship = ProfileMapper.IsBlockedRelationship(relationshipStatus);

        if (isBlockedRelationship)
        {
            return ProfileMapper.ToBlockedProfileResponseDto(userId, profile, relationshipStatus);
        }

        var postsCount = await _postRepository.CountByUserIdAsync(userId, cancellationToken);
        return ProfileMapper.ToProfileResponseDto(userId, profile, postsCount, relationshipStatus);
    }

    public async Task<MyProfileSettingsResponseDto> GetMyProfileSettingsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var overviewResult = await _javaUserProfileApiService.GetMyProfileOverviewAsync(accessToken, cancellationToken);
        JavaApiResultHelper.EnsureSuccessOrThrow(overviewResult, "Load profile overview failed.");

        return ProfileMapper.ToMyProfileSettingsResponseDto(userId, overviewResult.Data);
    }

    public async Task<ProfilePageInfoSettingsResponseDto> GetMyProfilePageInfoSettingsAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var result = await _javaUserProfileApiService.GetMyProfileInfoSettingsAsync(accessToken, cancellationToken);
        var data = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Load profile info settings failed.",
            "Java API returned empty profile info settings.");

        return ProfileMapper.ToProfilePageInfoSettingsResponseDto(data);
    }

    public async Task<ProfileInfoVisibilityResponseDto> GetMyProfilePageInfoVisibilityAsync(
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var result = await _javaUserProfileApiService.GetMyProfileInfoVisibilityAsync(accessToken, cancellationToken);
        var visibility = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            result,
            "Load profile info visibility failed.",
            "Java API returned empty profile info visibility.");

        return ProfileMapper.ToProfileInfoVisibilityResponseDto(visibility);
    }

    public async Task UpdateMyProfilePageInfoVisibilityAsync(
        UpdateProfileInfoVisibilityRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        if (!request.FullNameVisible.HasValue
            || !request.PhoneVisible.HasValue
            || !request.EmailVisible.HasValue
            || !request.DateOfBirthVisible.HasValue
            || !request.GenderVisible.HasValue
            || !request.FriendCountVisible.HasValue)
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "All visibility fields are required.");
        }

        var result = await _javaUserProfileApiService.UpdateMyProfileInfoVisibilityAsync(
            request,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Update profile page info visibility failed.");
    }

    public async Task UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();
        var result = await _javaUserProfileApiService.UpdateMyProfileAsync(request, accessToken, cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Update profile failed.");
    }

    public async Task<List<UserProfileSearchDto>> SearchByPhoneNumberAsync(
        string phoneNumber,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "phoneNumber is required.");
        }

        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var result = await _javaUserProfileApiService.SearchProfileByPhoneNumberAsync(
            phoneNumber.Trim(),
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Search profile failed.");

        return ProfileMapper.ToSearchResultList(result.Data);
    }

    public async Task<List<UserProfileSearchDto>> SearchByDisplayNameAsync(
        string displayName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "displayName is required.");
        }

        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var result = await _javaUserProfileApiService.SearchProfilesByDisplayNameAsync(
            displayName.Trim(),
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Search profile failed.");
        return result.Data ?? new List<UserProfileSearchDto>();
    }
}



using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Common.Enums;
using InteractHub.Api.Common.Exceptions;
using InteractHub.Api.Common.Utilities;

namespace InteractHub.Api.Application.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly IJavaCurrentUserApiService _javaCurrentUserApiService;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;

    public CurrentUserService(
        IAccessTokenProvider accessTokenProvider,
        IJavaCurrentUserApiService javaCurrentUserApiService,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService)
    {
        _accessTokenProvider = accessTokenProvider;
        _javaCurrentUserApiService = javaCurrentUserApiService;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
    }

    public async Task<CurrentUserResponseDto> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetAccessTokenOrNull();

        var profileLookup = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            [userId],
            cancellationToken,
            requireFresh: true,
            accessToken: accessToken);

        if (!profileLookup.TryGetValue(userId, out var profile) || profile is null)
        {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "User profile not found.");
        }

        return CurrentUserMapper.ToCurrentUserResponseDto(userId, profile);
    }

    public async Task<SecurityAccountInfoResponseDto> GetSecurityAccountInfoAsync(
        Guid userId,
        string? usernameFromClaims,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var privateSecurityResult = await _javaCurrentUserApiService.GetMySecurityPrivateProfileAsync(
            accessToken,
            cancellationToken);

        var privateSecurityProfile = JavaApiResultHelper.EnsureSuccessAndDataOrThrow(
            privateSecurityResult,
            "Load private security profile failed.",
            "Java security profile API returned empty data.");

        return privateSecurityProfile.ToSecurityAccountInfoResponseDto(usernameFromClaims);
    }

    public async Task UpdateSecurityAccountInfoAsync(
        string? resetToken,
        UpdateSecurityAccountRequestDto request,
        CancellationToken cancellationToken)
    {
        var accessToken = _accessTokenProvider.GetRequiredAccessToken();

        var normalizedResetToken = resetToken?.Trim();
        var normalizedRequest = request.ToNormalizedRequest();

        if (string.IsNullOrWhiteSpace(normalizedResetToken))
        {
            throw new BusinessException(ErrorCode.RESET_TOKEN_HEADER_REQUIRED);
        }

        if (normalizedRequest.Username is null && normalizedRequest.PhoneNumber is null)
        {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "username or phoneNumber is required.");
        }

        var result = await _javaCurrentUserApiService.UpdateMySecurityPrivateProfileAsync(
            normalizedResetToken,
            normalizedRequest,
            accessToken,
            cancellationToken);

        JavaApiResultHelper.EnsureSuccessOrThrow(result, "Update security account info failed.");
    }
}



using System.Net;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Profiles;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace InteractHub.Api.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IJavaApiService _javaApiService;
    private readonly IPostRepository _postRepository;
    private readonly ILogger<ProfileService> _logger;

    public ProfileService(
        IJavaApiService javaApiService,
        IPostRepository postRepository,
        ILogger<ProfileService> logger)
    {
        _javaApiService = javaApiService;
        _postRepository = postRepository;
        _logger = logger;
    }

    public async Task<JavaApiCallResult<ProfileResponseDto>> GetByUserIdAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var profile = await _javaApiService.GetProfileByUserId(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            if (profile is null)
            {
                return JavaApiCallResult<ProfileResponseDto>.Failure(
                    StatusCodes.Status404NotFound,
                    "Profile not found.");
            }

            var postsCount = await _postRepository.CountByUserIdAsync(userId, cancellationToken);
            var displayName = FirstNonEmpty(profile.DisplayName, "user") ?? "user";
            var response = new ProfileResponseDto
            {
                UserId = profile.UserId == Guid.Empty ? userId : profile.UserId,
                DisplayName = displayName,
                AvatarUrl = profile.AvatarUrl ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId),
                FriendsCount = profile.FriendsCount < 0 ? 0 : profile.FriendsCount,
                PostsCount = postsCount < 0 ? 0 : postsCount,
                PhoneNumber = FirstNonEmpty(profile.PhoneNumber),
                Gender = FirstNonEmpty(profile.Gender),
                BirthDate = FirstNonEmpty(profile.BirthDate),
                Status = FirstNonEmpty(profile.Status),
                Nickname = FirstNonEmpty(profile.Nickname)
            };

            return JavaApiCallResult<ProfileResponseDto>.Success(response, StatusCodes.Status200OK);
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogWarning(exception, "Java profile API rejected token for user {UserId}.", userId);
            return JavaApiCallResult<ProfileResponseDto>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java profile API is unavailable when loading profile for user {UserId}.", userId);
            return JavaApiCallResult<ProfileResponseDto>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java profile API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<MyProfileSettingsResponseDto>> GetMyProfileSettingsAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return JavaApiCallResult<MyProfileSettingsResponseDto>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized.");
        }

        var safeAccessToken = accessToken.Trim();
        var overviewResult = await _javaApiService.GetMyProfileOverviewAsync(safeAccessToken, cancellationToken);
        if (!overviewResult.IsSuccess)
        {
            return BuildFailure<MyProfileSettingsResponseDto>(
                overviewResult.StatusCode,
                overviewResult.ErrorMessage,
                "Load profile overview failed.");
        }

        var overview = overviewResult.Data;

        var resolvedUserId = userId;
        if (Guid.TryParse(overview?.UserId, out var userIdFromOverview))
        {
            resolvedUserId = userIdFromOverview;
        }

        var username = FirstNonEmpty(overview?.Username, "user") ?? "user";

        var displayName = FirstNonEmpty(
            overview?.DisplayName,
            overview?.FirstName,
            username,
            "user");

        var response = new MyProfileSettingsResponseDto
        {
            UserId = resolvedUserId,
            Username = username,
            DisplayName = displayName ?? "user",
            FirstName = FirstNonEmpty(overview?.FirstName),
            LastName = FirstNonEmpty(overview?.LastName),
            Email = overview?.Email,
            PhoneNumber = MaskPhoneNumber(FirstNonEmpty(overview?.PhoneNumber)),
            AvatarUrl = FirstNonEmpty(overview?.AvatarUrl) ?? AvatarUrlHelper.BuildDefaultAvatarUrl(resolvedUserId),
            BirthDate = FirstNonEmpty(overview?.BirthDate),
            Gender = FirstNonEmpty(overview?.Gender)
        };

        return JavaApiCallResult<MyProfileSettingsResponseDto>.Success(response, StatusCodes.Status200OK);
    }

    public Task<JavaApiCallResult<object?>> UpdateMyProfileAsync(
        UpdateMyProfileRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized."));
        }

        return _javaApiService.UpdateMyProfileAsync(request, accessToken.Trim(), cancellationToken);
    }

    public async Task<JavaApiCallResult<List<UserProfileSearchDto>>> SearchByPhoneNumberAsync(
        string phoneNumber,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return JavaApiCallResult<List<UserProfileSearchDto>>.Failure(
                StatusCodes.Status400BadRequest,
                "phoneNumber is required.");
        }

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return JavaApiCallResult<List<UserProfileSearchDto>>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized.");
        }

        var result = await _javaApiService.SearchProfileByPhoneNumberAsync(
            phoneNumber.Trim(),
            accessToken.Trim(),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BuildFailure<List<UserProfileSearchDto>>(
                result.StatusCode,
                result.ErrorMessage,
                "Search profile failed.");
        }

        var profiles = result.Data is null
            ? new List<UserProfileSearchDto>()
            : new List<UserProfileSearchDto> { result.Data };

        var statusCode = result.StatusCode > 0
            ? result.StatusCode
            : StatusCodes.Status200OK;

        return JavaApiCallResult<List<UserProfileSearchDto>>.Success(profiles, statusCode);
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

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return null;
    }

    private static string? MaskPhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return null;
        }

        var normalized = phoneNumber.Trim();
        if (normalized.Contains('*', StringComparison.Ordinal))
        {
            return normalized;
        }

        if (normalized.Length < 7)
        {
            return "****";
        }

        return $"{normalized[..3]}****{normalized[^4..]}";
    }
}

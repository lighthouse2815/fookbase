using System.Net;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Application.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IJavaApiService _javaApiService;
    private readonly ILogger<CurrentUserService> _logger;

    public CurrentUserService(
        IJavaApiService javaApiService,
        ILogger<CurrentUserService> logger)
    {
        _javaApiService = javaApiService;
        _logger = logger;
    }

    public async Task<JavaApiCallResult<CurrentUserResponseDto>> GetCurrentUserAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var profile = await _javaApiService.GetProfileSummaryByUserId(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            if (profile is null)
            {
                return JavaApiCallResult<CurrentUserResponseDto>.Failure(
                    StatusCodes.Status404NotFound,
                    "User profile not found.");
            }

            var fullName = string.IsNullOrWhiteSpace(profile.DisplayName)
                ? "user"
                : profile.DisplayName.Trim();

            var avatarUrl = string.IsNullOrWhiteSpace(profile.AvatarUrl)
                ? AvatarUrlHelper.BuildDefaultAvatarUrl(userId)
                : profile.AvatarUrl.Trim();

            var response = new CurrentUserResponseDto
            {
                Id = userId,
                FullName = fullName,
                AvatarUrl = avatarUrl
            };

            return JavaApiCallResult<CurrentUserResponseDto>.Success(response, StatusCodes.Status200OK);
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            _logger.LogWarning(exception, "Java profile API rejected token for user {UserId}.", userId);
            return JavaApiCallResult<CurrentUserResponseDto>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized.");
        }
        catch (HttpRequestException exception)
        {
            _logger.LogError(exception, "Java profile API is unavailable when loading /api/users/me for user {UserId}.", userId);
            return JavaApiCallResult<CurrentUserResponseDto>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Java profile API is unavailable.");
        }
    }

    public async Task<JavaApiCallResult<SecurityAccountInfoResponseDto>> GetSecurityAccountInfoAsync(
        Guid userId,
        string? accessToken,
        string? usernameFromClaims,
        CancellationToken cancellationToken)
    {
        var resolvedUsername = FirstNonEmpty(usernameFromClaims);

        if (string.IsNullOrWhiteSpace(resolvedUsername)
            && !string.IsNullOrWhiteSpace(accessToken))
        {
            resolvedUsername = await ResolveUsernameFromOverviewAsync(accessToken.Trim(), cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(resolvedUsername))
        {
            resolvedUsername = BuildFallbackUsername(userId);
            _logger.LogInformation(
                "Username is unavailable from claim and profile overview for user {UserId}. Using fallback.",
                userId);
        }

        var response = new SecurityAccountInfoResponseDto
        {
            Username = resolvedUsername
        };

        return JavaApiCallResult<SecurityAccountInfoResponseDto>.Success(response, StatusCodes.Status200OK);
    }

    private async Task<string?> ResolveUsernameFromOverviewAsync(string accessToken, CancellationToken cancellationToken)
    {
        var overviewResult = await _javaApiService.GetMyProfileOverviewAsync(accessToken, cancellationToken);
        if (!overviewResult.IsSuccess)
        {
            _logger.LogInformation(
                "Cannot load profile overview while resolving security username. StatusCode={StatusCode}, Error={Error}",
                overviewResult.StatusCode,
                overviewResult.ErrorMessage);
            return null;
        }

        return ExtractUsernameFromEmail(overviewResult.Data?.Email);
    }

    private static string? ExtractUsernameFromEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var trimmedEmail = email.Trim();
        var atIndex = trimmedEmail.IndexOf('@');

        if (atIndex <= 0)
        {
            return null;
        }

        var usernamePart = trimmedEmail[..atIndex].Trim();
        return string.IsNullOrWhiteSpace(usernamePart)
            ? null
            : usernamePart;
    }

    private static string BuildFallbackUsername(Guid userId)
    {
        return $"user_{userId.ToString("N")[..8]}";
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
}

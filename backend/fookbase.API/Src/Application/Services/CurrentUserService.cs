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
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return JavaApiCallResult<SecurityAccountInfoResponseDto>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized.");
        }

        var privateSecurityResult = await _javaApiService.GetMySecurityPrivateProfileAsync(
            accessToken.Trim(),
            cancellationToken);

        if (!privateSecurityResult.IsSuccess)
        {
            var statusCode = privateSecurityResult.StatusCode > 0
                ? privateSecurityResult.StatusCode
                : StatusCodes.Status502BadGateway;

            var errorMessage = string.IsNullOrWhiteSpace(privateSecurityResult.ErrorMessage)
                ? "Load private security profile failed."
                : privateSecurityResult.ErrorMessage;

            return JavaApiCallResult<SecurityAccountInfoResponseDto>.Failure(statusCode, errorMessage);
        }

        if (privateSecurityResult.Data is null)
        {
            return JavaApiCallResult<SecurityAccountInfoResponseDto>.Failure(
                StatusCodes.Status502BadGateway,
                "Java security profile API returned empty data.");
        }

        var resolvedUsername = FirstNonEmpty(privateSecurityResult.Data.Username, usernameFromClaims);

        if (string.IsNullOrWhiteSpace(resolvedUsername))
        {
            resolvedUsername = BuildFallbackUsername(userId);
            _logger.LogInformation(
                "Username is unavailable from private security profile and token claims for user {UserId}. Using fallback.",
                userId);
        }

        var response = new SecurityAccountInfoResponseDto
        {
            Username = resolvedUsername,
            Email = NormalizeOptional(privateSecurityResult.Data.Email),
            PhoneNumber = NormalizeOptional(privateSecurityResult.Data.PhoneNumber)
        };

        var successStatusCode = privateSecurityResult.StatusCode > 0
            ? privateSecurityResult.StatusCode
            : StatusCodes.Status200OK;

        return JavaApiCallResult<SecurityAccountInfoResponseDto>.Success(response, successStatusCode);
    }

    public Task<JavaApiCallResult<object?>> UpdateSecurityAccountInfoAsync(
        UpdateSecurityAccountRequestDto request,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status401Unauthorized,
                "Unauthorized."));
        }

        var otp = request.Otp?.Trim();
        var username = NormalizeOptional(request.Username);
        var phoneNumber = NormalizeOptional(request.PhoneNumber);

        if (string.IsNullOrWhiteSpace(otp))
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status400BadRequest,
                "otp is required."));
        }

        if (username is null && phoneNumber is null)
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status400BadRequest,
                "username or phoneNumber is required."));
        }

        var normalizedRequest = new UpdateSecurityAccountRequestDto
        {
            Otp = otp,
            Username = username,
            PhoneNumber = phoneNumber
        };

        return _javaApiService.UpdateMySecurityPrivateProfileAsync(
            normalizedRequest,
            accessToken.Trim(),
            cancellationToken);
    }

    private static string BuildFallbackUsername(Guid userId)
    {
        return $"user_{userId.ToString("N")[..8]}";
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
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

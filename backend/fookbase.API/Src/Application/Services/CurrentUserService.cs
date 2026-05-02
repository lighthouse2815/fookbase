using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Users;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Application.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IJavaApiService _javaApiService;
    private readonly IUserReadModelService _userReadModelService;
    private readonly ILogger<CurrentUserService> _logger;

    public CurrentUserService(
        IJavaApiService javaApiService,
        IUserReadModelService userReadModelService,
        ILogger<CurrentUserService> logger)
    {
        _javaApiService = javaApiService;
        _userReadModelService = userReadModelService;
        _logger = logger;
    }

    public async Task<JavaApiCallResult<CurrentUserResponseDto>> GetCurrentUserAsync(
        Guid userId,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var profileLookup = await _userReadModelService.ResolveProfileLookupAsync(
                [userId],
                cancellationToken,
                requireFresh: false,
                accessToken: accessToken);

            if (!profileLookup.TryGetValue(userId, out var profile) || profile is null)
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
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Could not load current-user profile for user {UserId}.", userId);
            return JavaApiCallResult<CurrentUserResponseDto>.Failure(
                StatusCodes.Status503ServiceUnavailable,
                "Current user profile is unavailable.");
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
            Email = privateSecurityResult.Data.Email.TrimToNull(),
            PhoneNumber = privateSecurityResult.Data.PhoneNumber.TrimToNull()
        };

        var successStatusCode = privateSecurityResult.StatusCode > 0
            ? privateSecurityResult.StatusCode
            : StatusCodes.Status200OK;

        return JavaApiCallResult<SecurityAccountInfoResponseDto>.Success(response, successStatusCode);
    }

    public Task<JavaApiCallResult<object?>> UpdateSecurityAccountInfoAsync(
        string? resetToken,
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

        var username = request.Username.TrimToNull();
        var phoneNumber = request.PhoneNumber.TrimToNull();
        var normalizedResetToken = resetToken?.Trim();

        if (string.IsNullOrWhiteSpace(normalizedResetToken))
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status400BadRequest,
                "X-Reset-Token header is required."));
        }

        if (username is null && phoneNumber is null)
        {
            return Task.FromResult(JavaApiCallResult<object?>.Failure(
                StatusCodes.Status400BadRequest,
                "username or phoneNumber is required."));
        }

        var normalizedRequest = new UpdateSecurityAccountRequestDto
        {
            Username = username,
            PhoneNumber = phoneNumber
        };

        return _javaApiService.UpdateMySecurityPrivateProfileAsync(
            normalizedResetToken,
            normalizedRequest,
            accessToken.Trim(),
            cancellationToken);
    }

    private static string BuildFallbackUsername(Guid userId)
    {
        return $"user_{userId.ToString("N")[..8]}";
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            var normalized = value.TrimToNull();
            if (normalized is not null)
            {
                return normalized;
            }
        }

        return null;
    }
}

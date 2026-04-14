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
}

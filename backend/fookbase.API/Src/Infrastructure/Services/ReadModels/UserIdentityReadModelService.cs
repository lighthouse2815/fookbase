using System.Net;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;

namespace InteractHub.Api.Infrastructure.Services.ReadModels;

public class UserIdentityReadModelService : IUserIdentityReadModelService
{
    private readonly IUserProfileSummaryReadModelRepository _userProfileSummaryReadModelRepository;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IJavaUserProfileApiService _javaUserProfileApiService;
    private readonly ILogger<UserIdentityReadModelService> _logger;

    public UserIdentityReadModelService(
        IUserProfileSummaryReadModelRepository userProfileSummaryReadModelRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IJavaUserProfileApiService javaUserProfileApiService,
        ILogger<UserIdentityReadModelService> logger)
    {
        _userProfileSummaryReadModelRepository = userProfileSummaryReadModelRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _javaUserProfileApiService = javaUserProfileApiService;
        _logger = logger;
    }

    public async Task<bool> ExistsAsync(
        Guid userId,
        CancellationToken cancellationToken,
        string? accessToken = null)
    {
        if (userId == Guid.Empty)
        {
            return false;
        }

        var cachedProfile = await _userProfileSummaryReadModelRepository.GetByUserIdAsync(userId, cancellationToken);
        if (cachedProfile is not null)
        {
            return true;
        }

        try
        {
            var profile = await _javaUserProfileApiService.GetProfileSummaryByUserIdAsync(
                userId,
                cancellationToken: cancellationToken,
                accessToken: accessToken);

            if (profile is null)
            {
                return false;
            }

            await _userProfileSummaryReadModelService.UpsertProfileAsync(
                profile.UserId == Guid.Empty ? userId : profile.UserId,
                profile.DisplayName,
                profile.AvatarUrl,
                observedAtUtc: DateTime.UtcNow,
                cancellationToken);

            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not resolve user identity for user {UserId}.", userId);
            throw;
        }
    }
}

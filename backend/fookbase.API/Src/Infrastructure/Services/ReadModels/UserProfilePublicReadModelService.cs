using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.Interfaces.Repositories;
using InteractHub.Api.Application.Interfaces.Services;
using InteractHub.Api.Application.Mappers;
using InteractHub.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace InteractHub.Api.Infrastructure.Services.ReadModels;

public class UserProfilePublicReadModelService : IUserProfilePublicReadModelService
{
    private readonly IFriendshipReadModelRepository _friendshipReadModelRepository;
    private readonly IUserProfileSummaryReadModelService _userProfileSummaryReadModelService;
    private readonly IJavaUserProfileApiService _javaUserProfileApiService;

    public UserProfilePublicReadModelService(
        IFriendshipReadModelRepository friendshipReadModelRepository,
        IUserProfileSummaryReadModelService userProfileSummaryReadModelService,
        IJavaUserProfileApiService javaUserProfileApiService)
    {
        _friendshipReadModelRepository = friendshipReadModelRepository;
        _userProfileSummaryReadModelService = userProfileSummaryReadModelService;
        _javaUserProfileApiService = javaUserProfileApiService;
    }

    public async Task<JavaApiCallResult<UserProfileDto>> GetByUserIdAsync(
        Guid requesterUserId,
        Guid targetUserId,
        string? accessToken,
        CancellationToken cancellationToken,
        bool requireFresh = false)
    {
        if (requesterUserId == Guid.Empty || targetUserId == Guid.Empty || requesterUserId == targetUserId)
        {
            return await _javaUserProfileApiService.GetProfileByUserIdAsync(
                targetUserId,
                accessToken,
                cancellationToken);
        }

        var relation = await _friendshipReadModelRepository.GetFriendshipRelationAsync(
            requesterUserId,
            targetUserId,
            cancellationToken);

        if (relation?.Status != FriendshipStatus.BLOCKED)
        {
            return await _javaUserProfileApiService.GetProfileByUserIdAsync(
                targetUserId,
                accessToken,
                cancellationToken);
        }

        var summaries = await _userProfileSummaryReadModelService.GetProfileSummariesAsync(
            [targetUserId],
            cancellationToken,
            requireFresh,
            accessToken);

        var summary = summaries.TryGetValue(targetUserId, out var value) ? value : null;
        var blockedProfile = UserProfilePublicReadModelMapper.ToBlockedProfile(targetUserId, summary);

        return JavaApiCallResult<UserProfileDto>.Success(blockedProfile, StatusCodes.Status200OK);
    }
}

using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class UserProfilePublicReadModelMapper
{
    public static UserProfileDto ToBlockedProfile(Guid targetUserId, UserProfileSummaryDto? summary)
    {
        return new UserProfileDto
        {
            UserId = targetUserId,
            DisplayName = summary?.DisplayName ?? "user",
            AvatarUrl = summary?.AvatarUrl,
            Status = FriendshipStatus.BLOCKED.ToString()
        };
    }
}

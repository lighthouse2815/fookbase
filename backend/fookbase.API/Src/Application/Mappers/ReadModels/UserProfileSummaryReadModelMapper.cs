using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class UserProfileSummaryReadModelMapper
{
    public static UserProfileSummaryDto ToProfileSummary(UserProfileSummaryReadModel profile)
    {
        return new UserProfileSummaryDto
        {
            UserId = profile.UserId,
            DisplayName = profile.DisplayName,
            AvatarUrl = profile.AvatarUrl
        };
    }

    public static void ApplyProfileSummary(
        UserProfileSummaryReadModel entity,
        Guid userId,
        string? displayName,
        string? avatarUrl,
        DateTime updatedAtUtc)
    {
        ArgumentNullException.ThrowIfNull(entity);

        entity.DisplayName = displayName.TrimToNull() ?? "user";
        entity.AvatarUrl = avatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(userId);
        entity.UpdatedAtUtc = updatedAtUtc;
    }
}

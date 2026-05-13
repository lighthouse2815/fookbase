using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Likes;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class LikeMapper
{
    public static PostReactionUserDto ToUserDto(
        this Like reaction,
        UserProfileSummaryDto? profile,
        string fallbackDisplayName = "user")
    {
        ArgumentNullException.ThrowIfNull(reaction);

        var displayName = profile?.DisplayName.TrimToNull() ?? fallbackDisplayName;
        var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(reaction.UserId);

        return new PostReactionUserDto
        {
            UserId = reaction.UserId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl,
            ReactionType = reaction.Type,
            ReactedAt = reaction.UpdatedAt
        };
    }

    public static PostReactionUsersResponseDto ToUsersResponseDto(
        Guid postId,
        IReadOnlyList<PostReactionUserDto> users)
    {
        ArgumentNullException.ThrowIfNull(users);

        return new PostReactionUsersResponseDto
        {
            PostId = postId,
            TotalCount = users.Count,
            Users = users
        };
    }

    public static PostReactionStateResponseDto ToStateResponseDto(
        Guid postId,
        ReactionType? reactionType,
        int reactionCount,
        IReadOnlyList<ReactionType> topReactionTypes)
    {
        ArgumentNullException.ThrowIfNull(topReactionTypes);

        return new PostReactionStateResponseDto
        {
            PostId = postId,
            ReactionType = reactionType,
            ReactionCount = reactionCount,
            TopReactionTypes = topReactionTypes
        };
    }
}

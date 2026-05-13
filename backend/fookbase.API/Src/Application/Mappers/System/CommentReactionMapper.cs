using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Common.Extensions;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class CommentReactionMapper
{
    public static CommentReactionUserDto ToUserDto(this CommentReaction reaction, UserProfileSummaryDto? profile)
    {
        ArgumentNullException.ThrowIfNull(reaction);

        var displayName = profile?.DisplayName.TrimToNull() ?? "user";
        var avatarUrl = profile?.AvatarUrl.TrimToNull() ?? AvatarUrlHelper.BuildDefaultAvatarUrl(reaction.UserId);

        return new CommentReactionUserDto
        {
            UserId = reaction.UserId,
            DisplayName = displayName,
            AvatarUrl = avatarUrl,
            ReactionType = reaction.Type,
            ReactedAt = reaction.UpdatedAt
        };
    }

    public static CommentReactionUsersResponseDto ToUsersResponseDto(
        Guid commentId,
        IReadOnlyList<CommentReactionUserDto> users)
    {
        ArgumentNullException.ThrowIfNull(users);

        return new CommentReactionUsersResponseDto
        {
            CommentId = commentId,
            TotalCount = users.Count,
            Users = users
        };
    }

    public static CommentReactionStateResponseDto ToStateResponseDto(Guid commentId, ReactionType? reactionType)
    {
        return new CommentReactionStateResponseDto
        {
            CommentId = commentId,
            ReactionType = reactionType
        };
    }
}




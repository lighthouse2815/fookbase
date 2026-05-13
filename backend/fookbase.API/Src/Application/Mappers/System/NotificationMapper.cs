using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;

namespace InteractHub.Api.Application.Mappers;

public static class NotificationMapper
{
    public static List<NotificationResponseDto> ToResponseDtos(
        this IEnumerable<Notification> notifications,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> actorProfiles)
    {
        ArgumentNullException.ThrowIfNull(notifications);
        ArgumentNullException.ThrowIfNull(actorProfiles);

        return notifications
            .Select(notification => notification.ToResponseDto(actorProfiles))
            .ToList();
    }

    public static NotificationResponseDto ToResponseDto(
        this Notification notification,
        IReadOnlyDictionary<Guid, UserProfileSummaryDto?> actorProfiles)
    {
        ArgumentNullException.ThrowIfNull(actorProfiles);

        var actorProfile = actorProfiles.TryGetValue(notification.ActorUserId, out var profile)
            ? profile
            : null;

        return notification.ToResponseDto(actorProfile?.DisplayName, actorProfile?.AvatarUrl);
    }

    public static NotificationResponseDto ToResponseDto(
        this Notification notification,
        string? actorDisplayName = null,
        string? actorAvatarUrl = null)
    {
        ArgumentNullException.ThrowIfNull(notification);

        var normalizedActorDisplayName = actorDisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedActorDisplayName))
        {
            normalizedActorDisplayName = "Someone";
        }

        var normalizedActorAvatarUrl = actorAvatarUrl?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedActorAvatarUrl))
        {
            normalizedActorAvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(notification.ActorUserId);
        }

        return new NotificationResponseDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            ActorUserId = notification.ActorUserId,
            ActorDisplayName = normalizedActorDisplayName,
            ActorAvatarUrl = normalizedActorAvatarUrl,
            PostId = notification.PostId,
            CommentId = notification.CommentId,
            StoryId = notification.StoryId,
            Type = notification.Type,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }
}

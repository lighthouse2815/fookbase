using InteractHub.Api.Application.DTOs.Admin;
using InteractHub.Api.Application.DTOs.AppReviews;
using InteractHub.Api.Application.DTOs.CommentReports;
using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Application.DTOs.JavaApi;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.StoryReports;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Application.DTOs.UserReports;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;
using InteractHub.Api.Domain.Enums;

namespace InteractHub.Api.Application.Mappers;

public static class EntityToDtoMapper
{
    public static CommentResponseDto ToResponseDto(this Comment comment)
    {
        ArgumentNullException.ThrowIfNull(comment);

        return new CommentResponseDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            UserId = comment.UserId,
            Author = new AuthorSummaryDto
            {
                Id = comment.UserId,
                DisplayName = "Đăng siu đẹp trai",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(comment.UserId)
            },
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    public static PostResponseDto ToResponseDto(this Post post)
    {
        ArgumentNullException.ThrowIfNull(post);

        var mediaUrls = ResolvePostMediaUrls(post);
        var reactionCount = post.Likes.Count;
        var topReactionTypes = post.Likes
            .GroupBy(like => NormalizePostReactionType(like.Type))
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key, StringComparer.Ordinal)
            .Take(3)
            .Select(group => group.Key)
            .ToList();

        return new PostResponseDto
        {
            Id = post.Id,
            UserId = post.UserId,
            Author = new AuthorSummaryDto
            {
                Id = post.UserId,
                DisplayName = "user",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(post.UserId)
            },
            Content = post.Content,
            ImageUrls = mediaUrls,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = reactionCount,
            ReactionCount = reactionCount,
            CurrentUserReactionType = null,
            TopReactionTypes = topReactionTypes,
            CommentCount = post.Comments.Count,
            Hashtags = post.PostHashtags
                .Where(postHashtag => postHashtag.Hashtag is not null)
                .Select(postHashtag => $"#{postHashtag.Hashtag!.Name}")
                .Distinct()
                .ToList()
        };
    }

    public static StoryResponseDto ToResponseDto(this Story story, DateTime currentTimeUtc)
    {
        ArgumentNullException.ThrowIfNull(story);

        return new StoryResponseDto
        {
            Id = story.Id,
            UserId = story.UserId,
            Author = new AuthorSummaryDto
            {
                Id = story.UserId,
                DisplayName = "user",
                AvatarUrl = AvatarUrlHelper.BuildDefaultAvatarUrl(story.UserId)
            },
            MediaUrl = story.MediaUrl,
            MediaType = story.MediaType,
            Content = story.Content,
            CreatedAt = story.CreatedAt,
            ExpiredAt = story.ExpiredAt,
            IsViewedByCurrentUser = false,
            CurrentUserReactionType = null,
            ViewCount = story.Views.Select(view => view.ViewerId).Distinct().Count()
        };
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
            Type = notification.Type,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }

    public static PostReportResponseDto ToResponseDto(
        this PostReport report,
        Guid? postOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? postOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new PostReportResponseDto
        {
            Id = report.Id,
            PostId = report.PostId,
            ReportedByUserId = report.ReportedByUserId,
            PostOwnerUserId = postOwnerUserId,
            Reason = report.Reason,
            Status = report.Status.ToString(),
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            PostOwner = postOwner
        };
    }

    public static CommentReportResponseDto ToResponseDto(
        this CommentReport report,
        Guid? commentOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? commentOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new CommentReportResponseDto
        {
            Id = report.Id,
            CommentId = report.CommentId,
            PostId = report.PostId,
            ReportedByUserId = report.ReportedByUserId,
            CommentOwnerUserId = commentOwnerUserId,
            Reason = report.Reason,
            Status = report.Status.ToString(),
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            CommentOwner = commentOwner
        };
    }

    public static UserReportResponseDto ToResponseDto(
        this UserReport report,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? targetUser = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new UserReportResponseDto
        {
            Id = report.Id,
            TargetUserId = report.TargetUserId,
            ReportedByUserId = report.ReportedByUserId,
            Reason = report.Reason,
            Status = report.Status.ToString(),
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            TargetUser = targetUser
        };
    }

    public static StoryReportResponseDto ToResponseDto(
        this StoryReport report,
        Guid? storyOwnerUserId = null,
        AuthorSummaryDto? reporter = null,
        AuthorSummaryDto? storyOwner = null)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new StoryReportResponseDto
        {
            Id = report.Id,
            StoryId = report.StoryId,
            StoryOwnerUserId = storyOwnerUserId,
            ReportedByUserId = report.ReportedByUserId,
            Reason = report.Reason,
            Status = report.Status.ToString(),
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            Reporter = reporter,
            StoryOwner = storyOwner
        };
    }

    public static AdminAuditLogResponseDto ToResponseDto(this AdminAuditLog log)
    {
        ArgumentNullException.ThrowIfNull(log);

        return new AdminAuditLogResponseDto
        {
            Id = log.Id,
            AdminUserId = log.AdminUserId,
            ActionType = log.ActionType,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            TargetUserId = log.TargetUserId,
            Details = log.Details,
            CreatedAt = log.CreatedAt
        };
    }

    public static AppReviewResponseDto ToResponseDto(this AppReview review)
    {
        ArgumentNullException.ThrowIfNull(review);

        return new AppReviewResponseDto
        {
            Id = review.Id,
            UserId = review.UserId,
            DisplayName = review.DisplayName,
            Rating = review.Rating,
            Comment = review.Comment,
            IsHidden = review.IsHidden,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }

    public static PublicAppReviewResponseDto ToPublicResponseDto(this AppReview review)
    {
        ArgumentNullException.ThrowIfNull(review);

        return new PublicAppReviewResponseDto
        {
            Id = review.Id,
            DisplayName = review.DisplayName,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }

    public static AdminUserSearchResponseDto ToResponseDto(this AdminUserSearchDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new AdminUserSearchResponseDto
        {
            UserId = dto.UserId,
            Username = dto.Username?.Trim() ?? string.Empty,
            DisplayName = dto.DisplayName?.Trim() ?? dto.Username?.Trim() ?? "user",
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl)
                ? AvatarUrlHelper.BuildDefaultAvatarUrl(dto.UserId)
                : dto.AvatarUrl.Trim(),
            Email = dto.Email?.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim(),
            Role = dto.Role?.Trim() ?? "USER",
            Status = dto.Status?.Trim() ?? "INACTIVE",
            CreatedAt = dto.CreatedAt,
            UpdatedAt = dto.UpdatedAt
        };
    }

    public static HashtagResponseDto ToResponseDto(this Hashtag hashtag, int usageCount)
    {
        ArgumentNullException.ThrowIfNull(hashtag);

        return new HashtagResponseDto
        {
            Id = hashtag.Id,
            Name = hashtag.Name,
            NormalizedName = hashtag.NormalizedName,
            UsageCount = usageCount,
            CreatedAt = hashtag.CreatedAt
        };
    }

    private static string NormalizePostReactionType(ReactionType type)
    {
        return type.ToString();
    }

    private static IReadOnlyList<string> ResolvePostMediaUrls(Post post)
    {
        var orderedMediaUrls = post.MediaItems
            .OrderBy(media => media.SortOrder)
            .Select(media => media.MediaUrl)
            .ToList();

        return PostMediaSerializer.Normalize(orderedMediaUrls);
    }
}

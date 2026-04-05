using InteractHub.Api.Application.DTOs.Comments;
using InteractHub.Api.Application.DTOs.Common;
using InteractHub.Api.Application.DTOs.Hashtags;
using InteractHub.Api.Application.DTOs.Notifications;
using InteractHub.Api.Application.DTOs.PostReports;
using InteractHub.Api.Application.DTOs.Posts;
using InteractHub.Api.Application.DTOs.Stories;
using InteractHub.Api.Common.Utilities;
using InteractHub.Api.Domain.Entities;

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
            ImageUrl = post.ImageUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            LikeCount = post.Likes.Count,
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
            ViewCount = story.Views.Select(view => view.ViewerId).Distinct().Count()
        };
    }

    public static NotificationResponseDto ToResponseDto(this Notification notification)
    {
        ArgumentNullException.ThrowIfNull(notification);

        return new NotificationResponseDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            ActorUserId = notification.ActorUserId,
            PostId = notification.PostId,
            CommentId = notification.CommentId,
            Type = notification.Type,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }

    public static PostReportResponseDto ToResponseDto(this PostReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new PostReportResponseDto
        {
            Id = report.Id,
            PostId = report.PostId,
            ReportedByUserId = report.ReportedByUserId,
            Reason = report.Reason,
            Status = report.Status,
            ResolvedByUserId = report.ResolvedByUserId,
            ResolvedAt = report.ResolvedAt,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt
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
}
